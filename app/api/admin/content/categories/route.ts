import { NextRequest, NextResponse } from 'next/server';
import { saveCategoryHeroes } from '@/lib/content/contentService';
import type { CategoryHero } from '@/lib/schemas/content';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, CategoryHero>;
    await saveCategoryHeroes(body);
    return NextResponse.json({ success: true, message: 'Category banners saved successfully' });
  } catch (error: any) {
    console.error('Failed to save category banners:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save category banners' },
      { status: 500 }
    );
  }
}
