import { NextResponse } from 'next/server';
import { seedAllContentToFirestore } from '@/lib/content/contentService';

export async function POST() {
  try {
    const result = await seedAllContentToFirestore();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
