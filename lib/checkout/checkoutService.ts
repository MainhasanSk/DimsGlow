import { adminDb } from '@/lib/firebase/admin';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import type { Order, OrderItemSnapshot, ShippingAddressSnapshot } from '@/lib/schemas/order';
import type { CartLineItem } from '@/lib/cart/CartContext';
import { FieldValue } from 'firebase-admin/firestore';
import type { SiteStoreSettings } from '@/lib/schemas/settings';

const DEFAULT_FREE_SHIPPING_THRESHOLD_PAISE = 39900; // ₹399
const DEFAULT_STANDARD_SHIPPING_FEE_PAISE = 4900; // ₹49
const GIFT_WRAP_FEE_PAISE = 9900; // ₹99

const VALID_COUPONS: Record<string, { discountPercent?: number; freeShipping?: boolean; minOrderPaise?: number }> = {
  EXTRA5: { discountPercent: 5 },
  SHIPFREE: { freeShipping: true },
};

export interface CalculateCheckoutInput {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  couponCode?: string;
  includeGiftWrap?: boolean;
}

export interface CheckoutCalculationResult {
  items: OrderItemSnapshot[];
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  giftWrapFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: 'INR';
  appliedCoupon?: string;
}

/**
 * Validates prices against the canonical catalog server-side.
 * Never trust client prices!
 */
export function calculateOrderTotals(
  input: CalculateCheckoutInput,
  storeSettings?: Partial<SiteStoreSettings>
): CheckoutCalculationResult {
  if (!input.items || input.items.length === 0) {
    throw new Error('Cannot calculate totals for an empty cart');
  }

  const validatedItems: OrderItemSnapshot[] = [];
  let subtotalPaise = 0;

  for (const item of input.items) {
    if (item.quantity <= 0 || item.quantity > 10) {
      throw new Error(`Invalid quantity ${item.quantity} for item`);
    }

    const product = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : product.variants[0];

    const unitPricePaise = variant ? variant.pricePaise : product.pricePaise;
    const itemTotalPaise = unitPricePaise * item.quantity;
    subtotalPaise += itemTotalPaise;

    validatedItems.push({
      productId: product.id,
      productName: product.name,
      variantId: variant?.id,
      variantTitle: variant?.title,
      sku: variant?.sku || `${product.id}-default`,
      unitPricePaise,
      quantity: item.quantity,
      totalPaise: itemTotalPaise,
      imageUrl: variant?.imageUrl || product.media[0]?.secureUrl,
    });
  }

  // Coupon calculation
  let discountPaise = 0;
  let hasFreeShippingCoupon = false;
  let appliedCoupon: string | undefined = undefined;

  if (input.couponCode) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      if (!coupon.minOrderPaise || subtotalPaise >= coupon.minOrderPaise) {
        appliedCoupon = code;
        if (coupon.discountPercent) {
          discountPaise = Math.round((subtotalPaise * coupon.discountPercent) / 100);
        }
        if (coupon.freeShipping) {
          hasFreeShippingCoupon = true;
        }
      }
    }
  }

  // Dynamic Shipping threshold and fees from Firestore settings
  const freeShippingThresholdPaise = (storeSettings?.freeDeliveryThresholdRupees != null
    ? storeSettings.freeDeliveryThresholdRupees * 100
    : DEFAULT_FREE_SHIPPING_THRESHOLD_PAISE);
  const standardShippingFeePaise = (storeSettings?.standardShippingFeeRupees != null
    ? storeSettings.standardShippingFeeRupees * 100
    : DEFAULT_STANDARD_SHIPPING_FEE_PAISE);

  // Shipping calculation
  const isFreeShipping = subtotalPaise >= freeShippingThresholdPaise || hasFreeShippingCoupon;
  const shippingFeePaise = isFreeShipping ? 0 : standardShippingFeePaise;
  const giftWrapFeePaise = input.includeGiftWrap ? GIFT_WRAP_FEE_PAISE : 0;
  const taxPaise = 0; // Tax is inclusive in all DIMSGLOW prices per Indian e-commerce standards

  const totalPaise = Math.max(0, subtotalPaise - discountPaise + shippingFeePaise + giftWrapFeePaise);

  return {
    items: validatedItems,
    subtotalPaise,
    discountPaise,
    shippingFeePaise,
    giftWrapFeePaise,
    taxPaise,
    totalPaise,
    currency: 'INR',
    appliedCoupon,
  };
}

export interface PlaceOrderInput {
  customerUid: string;
  customerEmail: string;
  shippingAddress: ShippingAddressSnapshot;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  couponCode?: string;
  includeGiftWrap?: boolean;
  orderNote?: string;
  paymentMethod?: string;
  idempotencyKey: string;
}

/**
 * Idempotent order placement executing inside an atomic Firestore transaction.
 * Reserves stock atomically, records movement ledger, and snapshots order.
 */
export async function placeOrderTransaction(input: PlaceOrderInput): Promise<Order> {
  const { customerUid, customerEmail, shippingAddress, idempotencyKey } = input;

  if (!idempotencyKey) {
    throw new Error('idempotencyKey is required for safe order creation');
  }

  // 1. Check idempotency: if an order with this idempotencyKey exists, return it
  const existingOrdersSnap = await adminDb
    .collection('orders')
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1)
    .get();

  if (!existingOrdersSnap.empty) {
    const existingDoc = existingOrdersSnap.docs[0];
    return existingDoc.data() as Order;
  }

  // 2. Fetch fresh store settings from Firestore for ACID calculation
  let freshSettings: Partial<SiteStoreSettings> | undefined;
  try {
    const settingsDoc = await adminDb.collection('siteSettings').doc('general').get();
    if (settingsDoc.exists) {
      freshSettings = settingsDoc.data() as Partial<SiteStoreSettings>;
    }
  } catch {
    // fallback to defaults
  }

  // 3. Calculate authoritative server-side totals
  const calc = calculateOrderTotals({
    items: input.items,
    couponCode: input.couponCode,
    includeGiftWrap: input.includeGiftWrap,
  }, freshSettings);

  const timestamp = Date.now();
  const orderNumber = `DG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderId = `ord_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  const orderData: Order = {
    id: orderId,
    orderNumber,
    customerUid,
    customerEmail,
    shippingAddress,
    items: calc.items,
    subtotalPaise: calc.subtotalPaise,
    discountPaise: calc.discountPaise,
    shippingFeePaise: calc.shippingFeePaise,
    taxPaise: calc.taxPaise,
    totalPaise: calc.totalPaise,
    currency: 'INR',
    status: 'placed',
    paymentStatus: 'pending', // Per ADR: Manual payment reconciliation in v1
    paymentMethod: input.paymentMethod || 'cod',
    idempotencyKey,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // 3. Execute atomic transaction for reservation and ledger
  await adminDb.runTransaction(async (transaction) => {
    // Check again within transaction if idempotencyKey was committed concurrently
    const concurrentCheck = await transaction.get(
      adminDb.collection('orders').where('idempotencyKey', '==', idempotencyKey).limit(1)
    );
    if (!concurrentCheck.empty) {
      return;
    }

    // Create order document
    const orderRef = adminDb.collection('orders').doc(orderId);
    transaction.set(orderRef, orderData);

    // Create order event: order_placed
    const eventRef = orderRef.collection('events').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      orderId,
      type: 'order_placed',
      actorUid: customerUid,
      actorRole: 'customer',
      note: input.orderNote || 'Order placed by customer via storefront checkout',
      createdAt: timestamp,
    });

    // Record stock reservation ledger entries for each item
    for (const item of calc.items) {
      const movementRef = adminDb.collection('stockMovements').doc();
      transaction.set(movementRef, {
        id: movementRef.id,
        productId: item.productId,
        variantId: item.variantId || 'default',
        sku: item.sku,
        type: 'order_reserved',
        quantityDelta: item.quantity,
        referenceId: orderId,
        referenceType: 'order',
        actorUid: customerUid,
        reason: `Reserved for order ${orderNumber}`,
        createdAt: timestamp,
      });
    }
  });

  // 4. Asynchronously clear user's cart in Firestore
  try {
    const cartItemsSnap = await adminDb
      .collection('carts')
      .doc(customerUid)
      .collection('items')
      .get();

    if (!cartItemsSnap.empty) {
      const batch = adminDb.batch();
      cartItemsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Non-blocking error clearing cart after order placement:', err);
  }

  return orderData;
}
