import { describe, it, expect } from 'vitest';
import {
  SupplierSchema,
  PurchaseOrderSchema,
  ExpenseSchema,
  CrmCustomerProfileSchema,
  CrmStaffNoteSchema,
  ReviewSchema,
} from '@/lib/schemas/operations';
import { generateExcelReport } from '@/lib/reports/reportService';
import ExcelJS from 'exceljs';

describe('Phase 10 — Operations, Procurement, Expense & CRM Schemas', () => {
  it('validates a compliant supplier record with 15-char Assam GSTIN', () => {
    const validSupplier = {
      id: 'sup_101',
      name: 'Aura Packaging Private Limited',
      contactPerson: 'Bikash Kalita',
      email: 'procurement@aurapack.in',
      phone: '9876543210',
      address: 'Industrial Estate, Bamunimaidam, Guwahati, Assam - 781021',
      gstin: '18AAAAA0000A1Z5',
      categoriesSupplied: ['Packaging', 'Glass Bottles'],
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = SupplierSchema.parse(validSupplier);
    expect(parsed.name).toBe('Aura Packaging Private Limited');
    expect(parsed.gstin).toBe('18AAAAA0000A1Z5');
  });

  it('rejects an invalid GSTIN format for a supplier', () => {
    const invalidSupplier = {
      id: 'sup_102',
      name: 'Bad GST Supplier',
      contactPerson: 'Rajesh',
      email: 'vendor@example.com',
      phone: '9876543210',
      address: 'Guwahati, Assam',
      gstin: 'INVALID_GSTIN_123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => SupplierSchema.parse(invalidSupplier)).toThrow();
  });

  it('validates purchase order with integer paise costs and line items', () => {
    const po = {
      id: 'po_001',
      poNumber: 'PO-2026-1001',
      supplierId: 'sup_101',
      supplierName: 'Aura Packaging',
      status: 'ordered' as const,
      items: [
        {
          productId: 'p_1',
          productTitle: '5-in-1 Skin Tint Foundation',
          sku: 'ST-001',
          orderedQuantity: 50,
          receivedQuantity: 0,
          unitCostPaise: 35000, // ₹350.00
          totalCostPaise: 1750000, // ₹17,500.00
        },
      ],
      totalAmountPaise: 1750000,
      orderedAt: Date.now(),
      createdByUid: 'admin_uid_1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = PurchaseOrderSchema.parse(po);
    expect(parsed.poNumber).toBe('PO-2026-1001');
    expect(parsed.items[0].unitCostPaise).toBe(35000);
  });

  it('validates operational expenses across categories and payment modes', () => {
    const expense = {
      id: 'exp_001',
      expenseNumber: 'EXP-2026-9001',
      title: 'Blue Dart Surface Logistics Disbursement',
      category: 'logistics' as const,
      amountPaise: 450000, // ₹4,500.00
      paymentMode: 'upi' as const,
      vendorName: 'Blue Dart Express Limited',
      referenceNumber: 'UTR202610169827361',
      date: Date.now(),
      notes: 'Monthly courier freight settlement',
      createdByUid: 'finance_uid_1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = ExpenseSchema.parse(expense);
    expect(parsed.category).toBe('logistics');
    expect(parsed.amountPaise).toBe(450000);
  });

  it('validates CRM customer profile and staff notes', () => {
    const profile = {
      uid: 'cust_uid_44',
      email: 'ananya.barua@gmail.com',
      displayName: 'Ananya Barua',
      phone: '+91 94350 12345',
      tags: ['vip' as const, 'repeat_buyer' as const],
      totalOrders: 6,
      lifetimeValuePaise: 954000, // ₹9,540.00
      averageOrderValuePaise: 159000,
      notesCount: 1,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    };

    const parsedProfile = CrmCustomerProfileSchema.parse(profile);
    expect(parsedProfile.tags).toContain('vip');
    expect(parsedProfile.totalOrders).toBe(6);

    const note = {
      id: 'note_1',
      customerUid: 'cust_uid_44',
      text: 'Client requested complimentary holiday gift wrapping on all upcoming orders.',
      authorUid: 'staff_1',
      authorName: 'Rani Sen',
      authorRole: 'support_manager',
      createdAt: Date.now(),
    };

    const parsedNote = CrmStaffNoteSchema.parse(note);
    expect(parsedNote.authorRole).toBe('support_manager');
  });

  it('validates customer review with 1-5 rating range', () => {
    const review = {
      id: 'rev_1',
      productId: 'prod_skin_tint',
      productSlug: '5-in-1-miracle-skin-tint-foundation',
      productTitle: '5-in-1 Miracle Skin Tint Foundation SPF 20',
      customerUid: 'cust_uid_44',
      customerName: 'Ananya Barua',
      rating: 5,
      title: 'Impeccable shade match and dewy finish',
      comment: 'Blends effortlessly into skin without any creasing. Very hydrating in high humidity.',
      verifiedPurchase: true,
      status: 'approved' as const,
      helpfulVotes: 4,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = ReviewSchema.parse(review);
    expect(parsed.rating).toBe(5);
    expect(parsed.verifiedPurchase).toBe(true);

    // Rejects out of bound rating
    expect(() => ReviewSchema.parse({ ...review, rating: 6 })).toThrow();
  });
});

describe('Phase 11 — Excel Workbook Generation (.xlsx)', () => {
  it('generates multi-sheet Excel report with Executive Summary and Ledgers', async () => {
    const { buildExcelWorkbook } = await import('@/lib/reports/reportService');

    const sampleSummary = {
      periodLabel: 'LAST 30 DAYS',
      totalGrossRevenuePaise: 4500000,
      totalNetRevenuePaise: 4200000,
      cancelledRevenuePaise: 300000,
      totalOrdersCount: 15,
      deliveredOrdersCount: 12,
      cancelledOrdersCount: 1,
      inTransitOrdersCount: 2,
      averageOrderValuePaise: 300000,
      totalExpensePaise: 850000,
      operatingProfitPaise: 3350000,
      ordersByStatus: { delivered: 12, shipped: 2, cancelled: 1 },
      topProducts: [
        {
          sku: 'ST-001',
          productTitle: '5-in-1 Skin Tint Foundation',
          unitsSold: 28,
          revenuePaise: 2377200,
        },
      ],
      dailyTrends: [],
    };

    const sampleOrders: any[] = [
      {
        orderNumber: 'DIMS-2026-1001',
        createdAt: Date.now(),
        customerEmail: 'ananya@example.com',
        shippingAddress: { fullName: 'Ananya Barua' },
        status: 'delivered',
        items: [{ quantity: 2 }],
        pricing: {
          subtotalPaise: 169800,
          taxTotalPaise: 25902,
          shippingFeePaise: 0,
          finalPayablePaise: 169800,
        },
        courier: { courierName: 'Blue Dart', trackingNumber: 'BD123456789' },
      },
    ];

    const sampleExpenses: any[] = [
      {
        expenseNumber: 'EXP-2026-9001',
        date: Date.now(),
        title: 'Packaging Cartons Run',
        category: 'packaging',
        vendorName: 'Aura Packaging',
        paymentMode: 'upi',
        referenceNumber: 'UTR987654321',
        amountPaise: 450000,
      },
    ];

    const excelBuffer = await buildExcelWorkbook(
      sampleSummary,
      sampleOrders,
      sampleExpenses,
      'owner@dimsglow.com'
    );

    expect(excelBuffer).toBeInstanceOf(Buffer);
    expect(excelBuffer.length).toBeGreaterThan(1000);

    // Verify it is a valid, readable Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer as any);

    expect(workbook.worksheets.length).toBeGreaterThanOrEqual(4);
    const summarySheet = workbook.getWorksheet('Executive Summary');
    expect(summarySheet).toBeDefined();

    const ordersSheet = workbook.getWorksheet('Orders Ledger');
    expect(ordersSheet).toBeDefined();

    const expensesSheet = workbook.getWorksheet('Operating Expenses');
    expect(expensesSheet).toBeDefined();

    const productSheet = workbook.getWorksheet('Top Products');
    expect(productSheet).toBeDefined();
  });
});
