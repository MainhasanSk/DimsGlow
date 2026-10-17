import { NextRequest, NextResponse } from 'next/server';
import { CATALOG_PRODUCTS, CATEGORIES } from '@/lib/data/catalog';
import { DEFAULT_HOMEPAGE_CONTENT, DEFAULT_CATEGORY_HEROES } from '@/lib/content/contentService';
import { db } from '@/lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const results = {
    productsCount: 0,
    categoriesCount: 0,
    contentSaved: false,
    errors: [] as string[],
  };

  try {
    // 1. Seed Products
    for (const product of CATALOG_PRODUCTS) {
      try {
        const productRef = doc(db, 'products', product.id);
        await setDoc(productRef, product, { merge: true });
        results.productsCount++;
      } catch (err: any) {
        results.errors.push(`Product ${product.id}: ${err.message || err}`);
      }
    }

    // 2. Seed Categories
    for (const cat of Object.values(CATEGORIES)) {
      try {
        const catRef = doc(db, 'categories', cat.id);
        await setDoc(catRef, cat, { merge: true });
        results.categoriesCount++;
      } catch (err: any) {
        results.errors.push(`Category ${cat.id}: ${err.message || err}`);
      }
    }

    // 3. Seed Site Content (Homepage + Category Heroes)
    try {
      const homeRef = doc(db, 'siteContent', 'homepage');
      await setDoc(homeRef, { ...DEFAULT_HOMEPAGE_CONTENT, updatedAt: Date.now() }, { merge: true });

      const catHeroesRef = doc(db, 'siteContent', 'categories');
      await setDoc(catHeroesRef, { categories: DEFAULT_CATEGORY_HEROES, updatedAt: Date.now() }, { merge: true });

      results.contentSaved = true;
    } catch (err: any) {
      results.errors.push(`SiteContent: ${err.message || err}`);
    }

    // 4. Seed Site Settings
    try {
      const settingsRef = doc(db, 'siteSettings', 'general');
      await setDoc(settingsRef, {
        brandName: 'DIMSGLOW',
        legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
        contactPhone: '+913614556830',
        contactEmail: 'support@dimsglow.com',
        freeShippingThresholdPaise: 39900,
        standardShippingFeePaise: 4900,
        gstRatePercent: 18,
        currency: 'INR',
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (err: any) {
      results.errors.push(`SiteSettings: ${err.message || err}`);
    }

    if (results.errors.length > 0 && results.productsCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Firestore rejected write operation due to Security Rules (PERMISSION_DENIED). Please check Firebase Console > Firestore > Rules tab and set rules to allow access.',
        details: results.errors,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: `Database successfully seeded! ${results.productsCount} products, ${results.categoriesCount} categories, and site content created in Cloud Firestore.`,
      results,
    });
  } catch (globalErr: any) {
    return NextResponse.json({
      success: false,
      error: globalErr.message || 'Seeding failed',
      details: results.errors,
    }, { status: 500 });
  }
}
