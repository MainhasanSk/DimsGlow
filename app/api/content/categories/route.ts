import { NextResponse } from 'next/server';
import { getCategoryHeroes } from '@/lib/content/contentService';

export async function GET() {
  try {
    const categories = await getCategoryHeroes();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories content' },
      { status: 500 }
    );
  }
}
