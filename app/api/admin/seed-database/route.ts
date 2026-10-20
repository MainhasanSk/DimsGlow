import { NextRequest, NextResponse } from 'next/server';
import { CATALOG_PRODUCTS, CATEGORIES } from '@/lib/data/catalog';
import { DEFAULT_HOMEPAGE_CONTENT, DEFAULT_CATEGORY_HEROES } from '@/lib/content/contentService';
import { saveFirestoreDoc } from '@/lib/firebase/firestoreRest';

export async function POST(req: NextRequest) {
  const results = {
    productsCount: 0,
    categoriesCount: 0,
    suppliersCount: 0,
    expensesCount: 0,
    reviewsCount: 0,
    contentSaved: false,
    settingsSaved: false,
    errors: [] as string[],
  };

  try {
    const timestamp = Date.now();

    // 1. Seed Products
    for (const product of CATALOG_PRODUCTS) {
      try {
        const ok = await saveFirestoreDoc('products', product.id, {
          ...product,
          updatedAt: timestamp,
        });
        if (ok) results.productsCount++;
        else results.errors.push(`Product ${product.id} failed to save`);
      } catch (err: any) {
        results.errors.push(`Product ${product.id}: ${err.message || err}`);
      }
    }

    // 2. Seed Categories
    for (const cat of Object.values(CATEGORIES)) {
      try {
        const ok = await saveFirestoreDoc('categories', cat.id, {
          ...cat,
          updatedAt: timestamp,
        });
        if (ok) results.categoriesCount++;
        else results.errors.push(`Category ${cat.id} failed to save`);
      } catch (err: any) {
        results.errors.push(`Category ${cat.id}: ${err.message || err}`);
      }
    }

    // 3. Seed Site Content (Homepage + Category Heroes)
    try {
      const okHome = await saveFirestoreDoc('siteContent', 'homepage', {
        ...DEFAULT_HOMEPAGE_CONTENT,
        updatedAt: timestamp,
      });
      const okCats = await saveFirestoreDoc('siteContent', 'categories', {
        categories: DEFAULT_CATEGORY_HEROES,
        updatedAt: timestamp,
      });
      results.contentSaved = okHome && okCats;
    } catch (err: any) {
      results.errors.push(`SiteContent: ${err.message || err}`);
    }

    // 4. Seed Site Settings
    try {
      results.settingsSaved = await saveFirestoreDoc('siteSettings', 'general', {
        brandName: 'DIMSGLOW',
        legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
        contactPhone: '+913614556830',
        contactEmail: 'support@dimsglow.com',
        freeShippingThresholdPaise: 39900,
        standardShippingFeePaise: 4900,
        gstRatePercent: 18,
        currency: 'INR',
        announcements: [
          '✨ WELCOME OFFER: Free Luxury Gift on all orders above ₹699',
          '⚡ Complimentary Express Shipping across India',
          '🌿 100% Toxic-Free, Dermatologically Certified Formulations',
        ],
        updatedAt: timestamp,
      });
    } catch (err: any) {
      results.errors.push(`SiteSettings: ${err.message || err}`);
    }

    // 5. Seed Suppliers & Vendors
    const sampleSuppliers = [
      {
        id: 'sup_aurapack',
        name: 'Aura Luxury Packaging Pvt Ltd',
        contactPerson: 'Rakesh Verma',
        email: 'sales@aurapackaging.in',
        phone: '+919811234567',
        address: 'B-42, Okhla Industrial Area Phase II, New Delhi - 110020',
        gstin: '07AAACA1234A1Z5',
        categoriesSupplied: ['packaging', 'cartons', 'bottles'],
        status: 'active',
        notes: 'Primary glass bottle and dropper packaging partner',
        createdAt: timestamp - 86400000 * 30,
        updatedAt: timestamp,
      },
      {
        id: 'sup_naturale',
        name: 'Naturale Active Formulations Ltd',
        contactPerson: 'Pooja Shah',
        email: 'pooja.shah@naturalebio.com',
        phone: '+919820123456',
        address: 'Plot 18, MIDC Industrial Area, Andheri East, Mumbai - 400093',
        gstin: '27AABCN5678B1Z2',
        categoriesSupplied: ['formulations', 'serums', 'lipsticks'],
        status: 'active',
        notes: 'Active manufacturer for Skin Tint & Matte Lipsticks',
        createdAt: timestamp - 86400000 * 45,
        updatedAt: timestamp,
      },
      {
        id: 'sup_delhivery',
        name: 'Delhivery Surface & Air Logistics',
        contactPerson: 'Arjun Nair',
        email: 'enterprises@delhivery.com',
        phone: '+918041234567',
        address: 'Whitefield Logistics Hub, Bengaluru - 560066',
        gstin: '29AABCD9012C1Z8',
        categoriesSupplied: ['logistics', 'express_courier'],
        status: 'active',
        notes: 'Nationwide express 3PL partner with live webhook tracking',
        createdAt: timestamp - 86400000 * 60,
        updatedAt: timestamp,
      },
    ];

    for (const sup of sampleSuppliers) {
      try {
        const ok = await saveFirestoreDoc('suppliers', sup.id, sup);
        if (ok) results.suppliersCount++;
      } catch (err: any) {
        results.errors.push(`Supplier ${sup.id}: ${err.message || err}`);
      }
    }

    // 6. Seed Operational Expenses
    const sampleExpenses = [
      {
        id: 'exp_001',
        expenseNumber: 'EXP-2026-0001',
        title: 'Custom Dropper Bottles & Gold Caps (10,000 units)',
        category: 'packaging',
        amountPaise: 4500000,
        paymentMode: 'bank_transfer',
        vendorName: 'Aura Luxury Packaging Pvt Ltd',
        referenceNumber: 'UTR-HDFC-9928192',
        date: timestamp - 86400000 * 10,
        receiptUrl: '',
        notes: 'First production run packaging lot',
        createdByUid: 'system_seed',
        createdAt: timestamp - 86400000 * 10,
        updatedAt: timestamp - 86400000 * 10,
      },
      {
        id: 'exp_002',
        expenseNumber: 'EXP-2026-0002',
        title: 'Courier Logistics Bulk Prepaid Wallet Credit',
        category: 'logistics',
        amountPaise: 1500000,
        paymentMode: 'upi',
        vendorName: 'Delhivery Surface & Air Logistics',
        referenceNumber: 'UPI-ICICI-8192837',
        date: timestamp - 86400000 * 5,
        receiptUrl: '',
        notes: 'Fulfillment balance reload',
        createdByUid: 'system_seed',
        createdAt: timestamp - 86400000 * 5,
        updatedAt: timestamp - 86400000 * 5,
      },
      {
        id: 'exp_003',
        expenseNumber: 'EXP-2026-0003',
        title: 'Digital Marketing & Social Ads Campaign',
        category: 'marketing',
        amountPaise: 2850000,
        paymentMode: 'credit_card',
        vendorName: 'Meta & Google Ads India',
        referenceNumber: 'CC-AMEX-48192',
        date: timestamp - 86400000 * 2,
        receiptUrl: '',
        notes: 'Spring festival campaign spend',
        createdByUid: 'system_seed',
        createdAt: timestamp - 86400000 * 2,
        updatedAt: timestamp - 86400000 * 2,
      },
    ];

    for (const exp of sampleExpenses) {
      try {
        const ok = await saveFirestoreDoc('expenses', exp.id, exp);
        if (ok) results.expensesCount++;
      } catch (err: any) {
        results.errors.push(`Expense ${exp.id}: ${err.message || err}`);
      }
    }

    // 7. Seed Sample Reviews
    const sampleReviews = [
      {
        id: 'rev_001',
        productId: 'prod_skin_tint',
        productSlug: 'skin-tint-5-in-1',
        productName: 'Skin Tint 5 In 1 Multifunctional Serum Foundation',
        customerUid: 'cust_sneha_1',
        customerName: 'Sneha Sen',
        customerEmail: 'sneha.sen@gmail.com',
        rating: 5,
        title: 'The dewy skin finish of my dreams!',
        comment: 'Literally replaced my daily BB cream and foundation. The rice water makes my skin glow all day without feeling oily.',
        verifiedPurchase: true,
        status: 'approved',
        createdAt: timestamp - 86400000 * 8,
        updatedAt: timestamp - 86400000 * 8,
      },
      {
        id: 'rev_002',
        productId: 'prod_matte_lipstick',
        productSlug: '24hrs-non-transfer-matte-lipstick',
        productName: '24 Hrs Non Transfer Matte Lipstick',
        customerUid: 'cust_priyanka_2',
        customerName: 'Priyanka Roy',
        customerEmail: 'priyanka.roy@gmail.com',
        rating: 5,
        title: 'Actually survives a full Indian dinner!',
        comment: 'Red Royale is the most flattering red lipstick I have ever owned. Zero bleeding, zero dry lips.',
        verifiedPurchase: true,
        status: 'approved',
        createdAt: timestamp - 86400000 * 4,
        updatedAt: timestamp - 86400000 * 4,
      },
      {
        id: 'rev_003',
        productId: 'prod_strobe_cream',
        productSlug: 'instant-glass-skin-strobe-cream',
        productName: 'Instant Glass Skin Strobe Cream',
        customerUid: 'cust_ananya_3',
        customerName: 'Ananya Deshmukh',
        customerEmail: 'ananya.d@gmail.com',
        rating: 5,
        title: 'Glass skin in 30 seconds',
        comment: 'Gives the most gorgeous ethereal glow under foundation or mixed with moisturizer. Highly recommended!',
        verifiedPurchase: true,
        status: 'pending',
        createdAt: timestamp - 86400000 * 1,
        updatedAt: timestamp - 86400000 * 1,
      },
    ];

    for (const rev of sampleReviews) {
      try {
        const ok = await saveFirestoreDoc('reviews', rev.id, rev);
        if (ok) results.reviewsCount++;
      } catch (err: any) {
        results.errors.push(`Review ${rev.id}: ${err.message || err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database successfully synchronized with Firebase Firestore! ${results.productsCount} products, ${results.categoriesCount} categories, ${results.suppliersCount} suppliers, ${results.expensesCount} expenses, and ${results.reviewsCount} reviews populated.`,
      results,
    });
  } catch (globalErr: any) {
    console.error('Database seeding error:', globalErr);
    return NextResponse.json({
      success: false,
      error: globalErr.message || 'Seeding failed',
      details: results.errors,
    }, { status: 500 });
  }
}
