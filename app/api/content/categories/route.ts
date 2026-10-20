import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CATEGORY_HEROES } from '@/lib/content/contentService';
import type { CategoryHero } from '@/lib/schemas/content';
import { getFirestoreDoc, saveFirestoreDoc } from '@/lib/firebase/firestoreRest';

const DATA_FILE = path.join(process.cwd(), 'lib', 'data', 'categoryHeroes.json');

function readStoredCategories(): Record<string, CategoryHero> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CATEGORY_HEROES, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read categoryHeroes.json, fallback to defaults:', err);
  }
  return DEFAULT_CATEGORY_HEROES;
}

function writeStoredCategories(data: Record<string, CategoryHero>): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write categoryHeroes.json:', err);
  }
}

export async function GET() {
  try {
    // 1. Try Firestore REST API directly
    try {
      const firestoreData = await getFirestoreDoc<{ categories?: Record<string, CategoryHero> }>(
        'siteContent',
        'categories'
      );
      if (firestoreData && firestoreData.categories) {
        const merged = { ...DEFAULT_CATEGORY_HEROES, ...firestoreData.categories };
        writeStoredCategories(merged);
        return NextResponse.json(merged);
      }
    } catch (e) {
      console.warn('Firestore categories GET warning, falling back to local store:', e);
    }

    // 2. Read from persistent JSON storage
    const categories = readStoredCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories content' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, CategoryHero>;
    const validated = { ...DEFAULT_CATEGORY_HEROES, ...body };

    // 1. Save to persistent data file
    writeStoredCategories(validated);

    // 2. Save directly to Cloud Firestore with authenticated Admin token
    let firestoreSaved = false;
    try {
      firestoreSaved = await saveFirestoreDoc('siteContent', 'categories', {
        categories: validated,
        updatedAt: Date.now(),
      });
    } catch (fsErr) {
      console.warn('Firestore server write categories notice:', fsErr);
    }

    return NextResponse.json({
      success: true,
      categories: validated,
      firestoreSaved,
      message: firestoreSaved
        ? 'Categories content updated dynamically and credited directly to Firebase Firestore!'
        : 'Categories content updated dynamically in database store!',
    });
  } catch (error: any) {
    console.error('Error saving categories content in API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update categories content' },
      { status: 500 }
    );
  }
}
