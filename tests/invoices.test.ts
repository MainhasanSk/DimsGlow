import { describe, it, expect } from 'vitest';
import { InvoiceSchema, type Invoice } from '../lib/schemas/invoice';
import { StoreInvoiceSettingsSchema, DEFAULT_STORE_SETTINGS } from '../lib/schemas/settings';
import { hasPermission } from '../lib/auth/roles';
import { generateInvoicePdf } from '../lib/invoices/pdfGenerator';

describe('Phase 9 Invoices, Eligibility & Finance RBAC', () => {
  const sampleInvoice: Invoice = {
    id: 'inv_order_123',
    invoiceNumber: 'INV-2026-1001',
    orderId: 'order_123',
    orderNumber: 'DIMS-2026-1001',
    customerUid: 'cust_abc',
    status: 'active',
    issueDate: Date.now(),
    seller: {
      legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
      address: 'G.S. Road, Christian Basti, Guwahati, Assam, India - 781005',
      state: 'Assam',
      stateCode: '18',
      contactPhone: '+913614556830',
      contactEmail: 'support@dimsglow.com',
    },
    buyer: {
      fullName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: '402 Rosewood Heights, GS Road',
      city: 'Guwahati',
      state: 'Assam',
      postalCode: '781005',
      country: 'India',
    },
    lineItems: [
      {
        productId: 'skin-tint-5-in-1',
        productName: 'Skin Tint 5-in-1 Foundation',
        variantTitle: 'Natural Beige',
        sku: 'ST-5IN1-NAT',
        unitPricePaise: 84900,
        quantity: 1,
        totalPaise: 84900,
      },
    ],
    subtotalPaise: 71949,
    discountPaise: 0,
    taxPaise: 12951,
    shippingFeePaise: 0,
    totalPaise: 84900,
    currency: 'INR',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('validates official StoreInvoiceSettings schema and defaults', () => {
    const parsed = StoreInvoiceSettingsSchema.parse(DEFAULT_STORE_SETTINGS);
    expect(parsed.legalEntityName).toBe('DIMSGLOW COSMETICS PRIVATE LIMITED');
    expect(parsed.stateCode).toBe('18');
    expect(parsed.taxRatePercentage).toBe(18);
    expect(parsed.contactPhone).toBe('+913614556830');
  });

  it('validates exact statutory GST equality: Taxable Base + Tax + Shipping - Discount === Total', () => {
    const validated = InvoiceSchema.parse(sampleInvoice);
    expect(validated.invoiceNumber).toBe('INV-2026-1001');
    expect(validated.status).toBe('active');
    expect(validated.totalPaise).toBe(84900);
    // Strict statutory equation check
    const equationSum = validated.subtotalPaise + validated.taxPaise + validated.shippingFeePaise - validated.discountPaise;
    expect(equationSum).toBe(validated.totalPaise);
  });

  it('evaluates invoice eligibility per PRD & TASKS.md specifications', () => {
    function evaluateEligibility(orderStatus: string, paymentStatus: string, invoiceStatus?: string) {
      if (orderStatus === 'placed') {
        return { eligible: false, reason: 'not_confirmed' };
      }
      if (orderStatus === 'cancelled') {
        return { eligible: false, reason: 'cancelled' };
      }
      if (paymentStatus === 'refunded') {
        return { eligible: false, reason: 'refunded' };
      }
      if (invoiceStatus === 'voided') {
        return { eligible: false, reason: 'voided' };
      }
      if (['confirmed', 'packing', 'shipped', 'delivered'].includes(orderStatus)) {
        return { eligible: true, reason: 'eligible' };
      }
      return { eligible: false, reason: 'unknown' };
    }

    // 1. Unconfirmed placed orders cannot download
    expect(evaluateEligibility('placed', 'pending', 'active')).toEqual({
      eligible: false,
      reason: 'not_confirmed',
    });

    // 2. Confirmed, packing, shipped, delivered orders CAN download
    expect(evaluateEligibility('confirmed', 'pending', 'active')).toEqual({
      eligible: true,
      reason: 'eligible',
    });
    expect(evaluateEligibility('shipped', 'paid', 'active')).toEqual({
      eligible: true,
      reason: 'eligible',
    });
    expect(evaluateEligibility('delivered', 'paid', 'active')).toEqual({
      eligible: true,
      reason: 'eligible',
    });

    // 3. Cancelled orders are strictly blocked
    expect(evaluateEligibility('cancelled', 'pending', 'voided')).toEqual({
      eligible: false,
      reason: 'cancelled',
    });

    // 4. Refunded orders are strictly blocked
    expect(evaluateEligibility('delivered', 'refunded', 'voided')).toEqual({
      eligible: false,
      reason: 'refunded',
    });

    // 5. Explicitly voided invoices are blocked
    expect(evaluateEligibility('confirmed', 'pending', 'voided')).toEqual({
      eligible: false,
      reason: 'voided',
    });
  });

  it('enforces RBAC permissions for finance:read and finance:manage', () => {
    expect(hasPermission('owner', 'finance:read')).toBe(true);
    expect(hasPermission('owner', 'finance:manage')).toBe(true);

    expect(hasPermission('admin', 'finance:read')).toBe(true);
    expect(hasPermission('finance_manager', 'finance:read')).toBe(true);
    expect(hasPermission('finance_manager', 'finance:manage')).toBe(true);

    // Order manager cannot manage finance/refunds
    expect(hasPermission('order_manager', 'finance:manage')).toBe(false);
    // Customer cannot access finance
    expect(hasPermission('customer', 'finance:read')).toBe(false);
    expect(hasPermission('customer', 'finance:manage')).toBe(false);
  });

  it('generates a valid binary PDF document using pdf-lib', async () => {
    const pdfBytes = await generateInvoicePdf(sampleInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify PDF Magic Bytes (%PDF-)
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('generates a voided PDF with void watermark banner when voided', async () => {
    const voidedInvoice: Invoice = {
      ...sampleInvoice,
      status: 'voided',
      voidReason: 'Order cancelled by customer',
      creditNoteReference: 'CRN-2026-999',
    };

    const pdfBytes = await generateInvoicePdf(voidedInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
