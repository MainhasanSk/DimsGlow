import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { SiteStoreSettingsSchema, DEFAULT_SITE_SETTINGS, type SiteStoreSettings } from '@/lib/schemas/settings';
import { FieldValue } from 'firebase-admin/firestore';

const SETTINGS_COLLECTION = 'siteSettings';
const SETTINGS_DOC_ID = 'general';

/**
 * GET /api/settings
 * Returns the store settings from Firestore.
 * Automatically seeds default settings into Firestore if document doesn't exist.
 */
export async function GET() {
  try {
    if (!adminDb || typeof adminDb.collection !== 'function') {
      return NextResponse.json(DEFAULT_SITE_SETTINGS, { status: 200 });
    }

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const snap = await docRef.get();

    if (!snap.exists) {
      // Seed initial settings atomically to Firestore
      const initialData: SiteStoreSettings = {
        ...DEFAULT_SITE_SETTINGS,
        updatedAt: new Date().toISOString(),
      };
      await docRef.set(initialData);
      return NextResponse.json(initialData, { status: 200 });
    }

    const data = snap.data();
    const parsed = SiteStoreSettingsSchema.safeParse(data);
    const result = parsed.success ? parsed.data : { ...DEFAULT_SITE_SETTINGS, ...(data || {}) };

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch store settings';
    console.error('Error fetching site settings:', err);
    return NextResponse.json(DEFAULT_SITE_SETTINGS, { status: 200 });
  }
}

/**
 * POST /api/settings
 * Transactionally updates store settings in Firestore and logs an audit record.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SiteStoreSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const validatedSettings: SiteStoreSettings = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    if (adminDb && typeof adminDb.runTransaction === 'function') {
      await adminDb.runTransaction(async (transaction) => {
        const settingsRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
        transaction.set(settingsRef, validatedSettings, { merge: true });

        // Log audit event
        const auditRef = adminDb.collection('auditEvents').doc();
        transaction.set(auditRef, {
          action: 'SETTINGS_UPDATE',
          actor: 'admin_panel',
          details: {
            freeDeliveryThreshold: validatedSettings.freeDeliveryThresholdRupees,
            standardShippingFee: validatedSettings.standardShippingFeeRupees,
            codAvailable: validatedSettings.codAvailable,
            brandName: validatedSettings.brandName,
            supportEmail: validatedSettings.supportEmail,
          },
          timestamp: FieldValue.serverTimestamp(),
        });
      });
    }

    return NextResponse.json({
      success: true,
      settings: validatedSettings,
      message: 'Store settings updated successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update store settings';
    console.error('Error saving site settings:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
