import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'dimsglow/products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'web8vmww';
    const apiKey = process.env.CLOUDINARY_API_KEY || '898349595447971';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'IGju5tzebtnACCVN5HlShNnDwao';

    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('folder', folder);
    uploadFormData.append('signature', signature);

    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text();
      console.error('Cloudinary API upload error:', cloudinaryRes.status, errText);
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${errText}` },
        { status: 502 }
      );
    }

    const data = await cloudinaryRes.json();
    return NextResponse.json({
      success: true,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resource_type,
    });
  } catch (err: any) {
    console.error('Server upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
