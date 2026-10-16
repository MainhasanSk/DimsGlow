import { NextResponse } from 'next/server';
import { getHomepageContent } from '@/lib/content/contentService';

export async function GET() {
  try {
    const content = await getHomepageContent();
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}
