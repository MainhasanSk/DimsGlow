import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/lib/content/contentService';
import type { HomepageContent } from '@/lib/schemas/content';
import { getFirestoreDoc, saveFirestoreDoc } from '@/lib/firebase/firestoreRest';

const DATA_FILE = path.join(process.cwd(), 'lib', 'data', 'homepageContent.json');

function readStoredContent(): HomepageContent {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_HOMEPAGE_CONTENT, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read homepageContent.json, fallback to defaults:', err);
  }
  return DEFAULT_HOMEPAGE_CONTENT;
}

function writeStoredContent(data: HomepageContent): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write homepageContent.json:', err);
  }
}

export async function GET() {
  try {
    // 1. Try Firestore REST API directly
    try {
      const firestoreData = await getFirestoreDoc<HomepageContent>('siteContent', 'homepage');
      if (firestoreData && firestoreData.heroSlides && firestoreData.heroSlides.length > 0) {
        const merged = { ...DEFAULT_HOMEPAGE_CONTENT, ...firestoreData };
        // Sync local cache file
        writeStoredContent(merged);
        return NextResponse.json(merged);
      }
    } catch (e) {
      console.warn('Firestore GET warning, falling back to local store:', e);
    }

    // 2. Read from persistent JSON storage
    const content = readStoredContent();
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HomepageContent;
    const validated: HomepageContent = {
      ...body,
      updatedAt: Date.now(),
    };

    // 1. Save to persistent data file
    writeStoredContent(validated);

    // 2. Save directly to Cloud Firestore with authenticated Admin token
    let firestoreSaved = false;
    try {
      firestoreSaved = await saveFirestoreDoc('siteContent', 'homepage', validated);
    } catch (fsErr) {
      console.warn('Firestore server write notice:', fsErr);
    }

    return NextResponse.json({
      success: true,
      content: validated,
      firestoreSaved,
      message: firestoreSaved
        ? 'Homepage content updated dynamically and credited directly to Firebase Firestore!'
        : 'Homepage content updated dynamically in database store!',
    });
  } catch (error: any) {
    console.error('Error saving homepage content in API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update homepage content' },
      { status: 500 }
    );
  }
}
