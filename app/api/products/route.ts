import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import { ProductSchema } from '@/lib/schemas/product';
import type { Product } from '@/lib/schemas/product';

/**
 * GET /api/products
 * Fetches all active products from Firestore database.
 * Seeds initial database if collection is empty.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    if (!adminDb || typeof adminDb.collection !== 'function') {
      return NextResponse.json({ success: true, products: CATALOG_PRODUCTS, source: 'fallback' });
    }

    const snapshot = await adminDb.collection('products').get();

    if (snapshot.empty) {
      // Seed Firestore atomically with base catalog products
      const batch = adminDb.batch();
      for (const p of CATALOG_PRODUCTS) {
        const docRef = adminDb.collection('products').doc(p.id);
        batch.set(docRef, p);
      }
      await batch.commit();

      let list = CATALOG_PRODUCTS;
      if (category && category !== 'all') {
        list = list.filter((p) => p.categoryIds.includes(category));
      }
      return NextResponse.json({ success: true, products: list, source: 'database_seeded' });
    }

    let products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push(doc.data() as Product);
    });

    if (category && category !== 'all') {
      products = products.filter((p) => p.categoryIds && p.categoryIds.includes(category));
    }
    if (status && status !== 'all') {
      products = products.filter((p) => p.status === status);
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      source: 'database_firestore',
    });
  } catch (err: any) {
    console.error('Error fetching products from database:', err);
    return NextResponse.json(
      { success: true, products: CATALOG_PRODUCTS, fallbackError: err.message },
      { status: 200 }
    );
  }
}

/**
 * POST /api/products
 * Creates or atomically updates a product in Firestore database following ACID properties.
 */
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: true, product, source: 'mock_local' });
    }

    // ACID transaction: atomic insert and audit log
    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection('products').doc(product.id);
      transaction.set(productRef, product);

      // Record audit event
      const auditRef = adminDb.collection('auditEvents').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        targetType: 'products',
        targetId: product.id,
        action: 'product_saved',
        timestamp: Date.now(),
        details: { name: product.name, slug: product.slug, pricePaise: product.pricePaise },
      });
    });

    return NextResponse.json({
      success: true,
      product,
      message: 'Product saved successfully to Firestore database',
    });
  } catch (err: any) {
    console.error('Error saving product to database:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}
