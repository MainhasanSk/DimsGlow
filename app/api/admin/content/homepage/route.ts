import { NextRequest, NextResponse } from 'next/server';
import { saveHomepageContent } from '@/lib/content/contentService';
import type { HomepageContent } from '@/lib/schemas/content';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HomepageContent;
    await saveHomepageContent(body);
    return NextResponse.json({ success: true, message: 'Homepage content saved successfully' });
  } catch (error: any) {
    console.error('Failed to save homepage content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save content' },
      { status: 500 }
    );
  }
}
