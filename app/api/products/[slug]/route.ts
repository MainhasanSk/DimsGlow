import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import { ProductSchema } from '@/lib/schemas/product';
import type { Product } from '@/lib/schemas/product';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!adminDb || typeof adminDb.collection !== 'function') {
      const p = CATALOG_PRODUCTS.find((item) => item.slug === slug);
      return NextResponse.json({ success: !!p, product: p || null });
    }

    const querySnap = await adminDb
      .collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      return NextResponse.json({ success: true, product: doc.data() as Product });
    }

    // Fallback to base catalog
    const fallbackProduct = CATALOG_PRODUCTS.find((item) => item.slug === slug);
    return NextResponse.json({ success: !!fallbackProduct, product: fallbackProduct || null });
  } catch (err: any) {
    console.error('Error fetching product by slug:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const product = parsed.data;

    if (!adminDb || typeof adminDb.runTransaction !== 'function') {
      return NextResponse.json({ success: true, product });
    }

    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection('products').doc(product.id);
      transaction.set(productRef, product);

      const auditRef = adminDb.collection('auditEvents').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        targetType: 'products',
        targetId: product.id,
        action: 'product_updated',
        timestamp: Date.now(),
        details: { name: product.name, slug: product.slug, pricePaise: product.pricePaise },
      });
    });

    return NextResponse.json({ success: true, product, message: 'Product updated in Firestore' });
  } catch (err: any) {
    console.error('Error updating product in database:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!adminDb || typeof adminDb.runTransaction !== 'function') {
      return NextResponse.json({ success: true, message: 'Product marked deleted' });
    }

    // Find document by slug or ID
    let docId = slug;
    const querySnap = await adminDb
      .collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!querySnap.empty) {
      docId = querySnap.docs[0].id;
    }

    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection('products').doc(docId);
      transaction.delete(productRef);

      const auditRef = adminDb.collection('auditEvents').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        targetType: 'products',
        targetId: docId,
        action: 'product_deleted',
        timestamp: Date.now(),
        details: { slug },
      });
    });

    return NextResponse.json({ success: true, message: 'Product deleted from Firestore' });
  } catch (err: any) {
    console.error('Error deleting product from database:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
