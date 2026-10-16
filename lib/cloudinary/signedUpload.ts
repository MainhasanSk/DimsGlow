import 'server-only';
import crypto from 'crypto';

export interface CloudinarySignatureParams {
  folder: string;
  timestamp: number;
  tags?: string;
}

/**
 * Generates a SHA-1 signature for authorized Cloudinary client uploads.
 * Restricts target folders to approved namespaces: dimsglow/products, dimsglow/categories, dimsglow/campaigns.
 * The API secret is NEVER exposed to the client.
 */
export function generateCloudinarySignature(params: CloudinarySignatureParams): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const apiKey = process.env.CLOUDINARY_API_KEY || '898349595447971';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'IGju5tzebtnACCVN5HlShNnDwao';
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'web8vmww';

  const allowedFolders = [
    'dimsglow/products',
    'dimsglow/categories',
    'dimsglow/campaigns',
    'dimsglow/editorial',
  ];

  if (!allowedFolders.includes(params.folder)) {
    throw new Error(`Unauthorized upload folder [${params.folder}]. Allowed: ${allowedFolders.join(', ')}`);
  }

  // Construct parameter string for signing sorted alphabetically
  const toSignParts: string[] = [];
  toSignParts.push(`folder=${params.folder}`);
  if (params.tags) toSignParts.push(`tags=${params.tags}`);
  toSignParts.push(`timestamp=${params.timestamp}`);

  const toSignString = toSignParts.join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(toSignString).digest('hex');

  return {
    signature,
    timestamp: params.timestamp,
    apiKey,
    cloudName,
    folder: params.folder,
  };
}
