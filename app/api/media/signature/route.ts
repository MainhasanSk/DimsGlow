import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession, assertPermission } from '@/lib/auth/serverAuth';
import { generateCloudinarySignature } from '@/lib/cloudinary/signedUpload';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or malformed token' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const session = await verifyServerSession(idToken);
    assertPermission(session, 'catalog:manage');

    const body = await req.json();
    const folder = body.folder || 'dimsglow/products';
    const timestamp = Math.round(Date.now() / 1000);

    const signedParams = generateCloudinarySignature({
      folder,
      timestamp,
      tags: body.tags,
    });

    return NextResponse.json(signedParams);
  } catch (error: any) {
    console.error('Signature endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate media signature' },
      { status: 403 }
    );
  }
}
