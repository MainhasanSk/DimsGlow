import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  severity: 'critical' | 'low' | 'out_of_stock';
  status: 'active' | 'resolved' | 'dismissed';
  createdAt: number;
  resolvedAt?: number;
  dismissedBy?: string;
}

/** GET /api/admin/alerts — list low-stock alerts (auto-generated from inventory) */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh=true, re-scan inventory and create fresh alerts
    if (refresh) {
      await refreshLowStockAlerts(session.uid, session.role);
    }

    // Fetch current alerts from database
    let query = adminDb.collection('alerts').orderBy('createdAt', 'desc') as any;
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snap = await query.limit(200).get();
    const alerts: LowStockAlert[] = [];
    snap.forEach((d: any) => alerts.push(d.data() as LowStockAlert));

    return NextResponse.json({ success: true, alerts, total: alerts.length });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching low-stock alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/** PATCH /api/admin/alerts — dismiss or resolve an alert */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { alertId, action } = body; // action: 'dismiss' | 'resolve'

    if (!alertId || !['dismiss', 'resolve'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'alertId and action (dismiss|resolve) are required' },
        { status: 400 }
      );
    }

    const alertRef = adminDb.collection('alerts').doc(alertId);
    const snap = await alertRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      updatedAt: Date.now(),
    };
    if (action === 'dismiss') updates.dismissedBy = session.uid;
    if (action === 'resolve') updates.resolvedAt = Date.now();

    await alertRef.update(updates);

    return NextResponse.json({ success: true, message: `Alert ${action}d` });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}

/**
 * Scans all product variants and creates/updates low-stock alerts in Firestore.
 * Called on demand with ?refresh=true, or can be triggered by a scheduled function.
 */
async function refreshLowStockAlerts(actorUid: string, actorRole: string) {
  const productsSnap = await adminDb.collection('products').get();
  const batch = adminDb.batch();
  let alertCount = 0;

  for (const productDoc of productsSnap.docs) {
    const product = productDoc.data();
    const variantsSnap = await adminDb
      .collection('products')
      .doc(productDoc.id)
      .collection('variants')
      .get();

    for (const variantDoc of variantsSnap.docs) {
      const variant = variantDoc.data();
      const onHand = variant.onHand ?? 0;
      const reserved = variant.reserved ?? 0;
      const available = onHand - reserved;
      const threshold = variant.lowStockThreshold ?? 5;

      if (available <= 0 || available <= threshold) {
        const severity: LowStockAlert['severity'] =
          available <= 0 ? 'out_of_stock' : available <= Math.floor(threshold / 2) ? 'critical' : 'low';

        // Check if active alert already exists for this variant
        const existingSnap = await adminDb
          .collection('alerts')
          .where('productId', '==', productDoc.id)
          .where('variantId', '==', variantDoc.id)
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (existingSnap.empty) {
          const alertRef = adminDb.collection('alerts').doc();
          const alert: LowStockAlert = {
            id: alertRef.id,
            productId: productDoc.id,
            productName: product.name || 'Unknown Product',
            variantId: variantDoc.id,
            variantLabel: variant.label || variant.options?.join(' / ') || 'Default',
            sku: variant.sku || '',
            currentStock: available,
            lowStockThreshold: threshold,
            severity,
            status: 'active',
            createdAt: Date.now(),
          };
          batch.set(alertRef, alert);
          alertCount++;
        } else {
          // Update severity if it changed
          const existing = existingSnap.docs[0];
          if (existing.data().severity !== severity || existing.data().currentStock !== available) {
            batch.update(existing.ref, { severity, currentStock: available, updatedAt: Date.now() });
          }
        }
      }
    }
  }

  if (alertCount > 0 || productsSnap.size > 0) {
    await batch.commit();
  }
}
