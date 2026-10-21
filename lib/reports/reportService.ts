import 'server-only';
import ExcelJS from 'exceljs';
import { adminDb } from '@/lib/firebase/admin';
import type { Order } from '@/lib/schemas/order';
import type { Expense } from '@/lib/schemas/operations';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export interface ReportDateFilter {
  range?: '7d' | '30d' | '12m' | 'all';
  startDate?: number;
  endDate?: number;
}

export interface AnalyticsSummary {
  periodLabel: string;
  totalGrossRevenuePaise: number;
  totalNetRevenuePaise: number;
  cancelledRevenuePaise: number;
  totalOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  inTransitOrdersCount: number;
  averageOrderValuePaise: number;
  totalExpensePaise: number;
  operatingProfitPaise: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    sku: string;
    productTitle: string;
    unitsSold: number;
    revenuePaise: number;
  }>;
  dailyTrends: Array<{
    dateLabel: string;
    revenuePaise: number;
    ordersCount: number;
    expensePaise: number;
  }>;
}

export async function getAnalyticsSummary(filter?: ReportDateFilter): Promise<AnalyticsSummary> {
  const now = Date.now();
  let startTime = 0;

  if (filter?.range === '7d') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (filter?.range === '30d') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  } else if (filter?.range === '12m') {
    startTime = now - 365 * 24 * 60 * 60 * 1000;
  } else if (filter?.startDate) {
    startTime = filter.startDate;
  }

  const endTime = filter?.endDate || now;

  // 1. Fetch Orders without compound index dependencies
  const ordersSnap = await adminDb.collection('orders').get();
  const allOrders: Order[] = [];
  ordersSnap.forEach((doc) => allOrders.push(doc.data() as Order));

  const filteredOrders = allOrders.filter(
    (o) => {
      const created = Number(o.createdAt) || 0;
      return created >= startTime && created <= endTime;
    }
  );

  // 2. Fetch Expenses without compound index dependencies
  const expensesSnap = await adminDb.collection('expenses').get();
  const allExpenses: Expense[] = [];
  expensesSnap.forEach((doc) => allExpenses.push(doc.data() as Expense));

  const filteredExpenses = allExpenses.filter(
    (e) => {
      const expDate = Number(e.date) || 0;
      return expDate >= startTime && expDate <= endTime;
    }
  );

  // 3. Compute Metrics
  let totalGrossRevenuePaise = 0;
  let totalNetRevenuePaise = 0;
  let cancelledRevenuePaise = 0;
  let deliveredOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let inTransitOrdersCount = 0;
  const ordersByStatus: Record<string, number> = {};
  const productStats = new Map<string, { sku: string; title: string; units: number; revenue: number }>();

  for (const order of filteredOrders) {
    const status = order.status || 'placed';
    ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

    const orderAmount = Number(order.totalPaise) || 0;
    totalGrossRevenuePaise += orderAmount;

    if (status === 'cancelled') {
      cancelledRevenuePaise += orderAmount;
      cancelledOrdersCount++;
    } else {
      totalNetRevenuePaise += orderAmount;
      if (status === 'delivered') deliveredOrdersCount++;
      if (['shipped', 'packing'].includes(status)) inTransitOrdersCount++;

      // Track item sales
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const key = item.sku || item.productId || 'item';
          const title = item.productName || (item as any).titleSnapshot || 'Luxury Cosmetic';
          const current = productStats.get(key) || {
            sku: key,
            title,
            units: 0,
            revenue: 0,
          };
          current.units += Number(item.quantity) || 1;
          current.revenue += (Number(item.quantity) || 1) * (Number(item.unitPricePaise) || 0);
          productStats.set(key, current);
        }
      }
    }
  }

  const totalOrdersCount = filteredOrders.length;
  const validOrdersCount = totalOrdersCount - cancelledOrdersCount;
  const averageOrderValuePaise =
    validOrdersCount > 0 ? Math.round(totalNetRevenuePaise / validOrdersCount) : 0;

  const totalExpensePaise = filteredExpenses.reduce((sum, e) => sum + (Number(e.amountPaise) || 0), 0);
  const operatingProfitPaise = totalNetRevenuePaise - totalExpensePaise;

  const topProducts = Array.from(productStats.values())
    .map((p) => ({
      sku: p.sku,
      productTitle: p.title,
      unitsSold: p.units,
      revenuePaise: p.revenue,
    }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 8);

  // Group trends by day (last 7 or 14 buckets)
  const trendsMap = new Map<string, { rev: number; count: number; exp: number }>();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysToShow = filter?.range === '7d' ? 7 : 14;

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    trendsMap.set(label, { rev: 0, count: 0, exp: 0 });
  }

  for (const o of filteredOrders) {
    if (o.status !== 'cancelled') {
      const d = new Date(o.createdAt);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (trendsMap.has(label)) {
        const item = trendsMap.get(label)!;
        item.rev += o.totalPaise;
        item.count++;
      }
    }
  }

  for (const e of filteredExpenses) {
    const d = new Date(e.date);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (trendsMap.has(label)) {
      trendsMap.get(label)!.exp += e.amountPaise;
    }
  }

  const dailyTrends = Array.from(trendsMap.entries()).map(([label, val]) => ({
    dateLabel: label,
    revenuePaise: val.rev,
    ordersCount: val.count,
    expensePaise: val.exp,
  }));

  return {
    periodLabel: filter?.range ? filter.range.toUpperCase() : 'Custom Date Range',
    totalGrossRevenuePaise,
    totalNetRevenuePaise,
    cancelledRevenuePaise,
    totalOrdersCount,
    deliveredOrdersCount,
    cancelledOrdersCount,
    inTransitOrdersCount,
    averageOrderValuePaise,
    totalExpensePaise,
    operatingProfitPaise,
    ordersByStatus,
    topProducts,
    dailyTrends,
  };
}

/**
 * Generates an executive-ready multi-sheet Microsoft Excel (.xlsx) workbook.
 */
/**
 * Pure builder function to construct the multi-sheet Microsoft Excel (.xlsx) workbook.
 */
export async function buildExcelWorkbook(
  summary: AnalyticsSummary,
  orders: Order[],
  expenses: Expense[],
  actorEmail: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = `DIMSGLOW Enterprise (${actorEmail})`;
  workbook.created = new Date();

  // --------------------------------------------------------------------------
  // SHEET 1: Executive KPI Overview
  // --------------------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Executive Summary');
  summarySheet.views = [{ showGridLines: true }];

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value (INR)', key: 'value', width: 25 },
    { header: 'Notes / Formula', key: 'notes', width: 40 },
  ];

  // Header style
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F161E' }, // DIMSGLOW Executive Plum Dark
  };

  summarySheet.addRow({
    metric: 'Report Period',
    value: summary.periodLabel,
    notes: 'Generated on ' + new Date().toLocaleString('en-IN'),
  });
  summarySheet.addRow({
    metric: 'Net Sales Revenue',
    value: (summary.totalNetRevenuePaise / 100).toFixed(2),
    notes: 'Gross sales excluding cancelled orders',
  });
  summarySheet.addRow({
    metric: 'Gross Sales Revenue',
    value: (summary.totalGrossRevenuePaise / 100).toFixed(2),
    notes: 'All orders placed including cancellations',
  });
  summarySheet.addRow({
    metric: 'Cancelled / Refunded Sales',
    value: (summary.cancelledRevenuePaise / 100).toFixed(2),
    notes: 'Voided order volume',
  });
  summarySheet.addRow({
    metric: 'Total Orders',
    value: summary.totalOrdersCount,
    notes: 'All order lifecycle records',
  });
  summarySheet.addRow({
    metric: 'Delivered Orders',
    value: summary.deliveredOrdersCount,
    notes: 'Completed courier fulfillments',
  });
  summarySheet.addRow({
    metric: 'Average Order Value (AOV)',
    value: (summary.averageOrderValuePaise / 100).toFixed(2),
    notes: 'Net revenue / successful orders',
  });
  summarySheet.addRow({
    metric: 'Total Operating Expenses',
    value: (summary.totalExpensePaise / 100).toFixed(2),
    notes: 'Logistics, packaging, marketing & overheads',
  });
  summarySheet.addRow({
    metric: 'Operating Profit (EBITDA)',
    value: (summary.operatingProfitPaise / 100).toFixed(2),
    notes: 'Net Revenue minus Recorded Expenses',
  });

  // --------------------------------------------------------------------------
  // SHEET 2: Orders Ledger
  // --------------------------------------------------------------------------
  const ordersSheet = workbook.addWorksheet('Orders Ledger');
  ordersSheet.views = [{ showGridLines: true }];

  ordersSheet.columns = [
    { header: 'Order #', key: 'orderNumber', width: 16 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Items Count', key: 'items', width: 12 },
    { header: 'Subtotal (₹)', key: 'subtotal', width: 14 },
    { header: 'GST Tax (₹)', key: 'tax', width: 12 },
    { header: 'Shipping (₹)', key: 'shipping', width: 12 },
    { header: 'Total Paid (₹)', key: 'total', width: 16 },
    { header: 'Courier', key: 'courier', width: 16 },
    { header: 'AWB Tracking #', key: 'tracking', width: 20 },
  ];

  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ordersSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB83B63' }, // DIMSGLOW Rose Wine
  };

  orders.forEach((o) => {
    ordersSheet.addRow({
      orderNumber: o.orderNumber,
      date: new Date(o.createdAt).toLocaleDateString('en-IN'),
      customer: o.shippingAddress?.fullName || 'Client',
      email: o.customerEmail,
      status: o.status.toUpperCase(),
      items: o.items?.reduce((s, i) => s + i.quantity, 0) || 1,
      subtotal: ((o.subtotalPaise || o.totalPaise) / 100).toFixed(2),
      tax: ((o.taxPaise || 0) / 100).toFixed(2),
      shipping: ((o.shippingFeePaise || 0) / 100).toFixed(2),
      total: (o.totalPaise / 100).toFixed(2),
      courier: o.courier?.courierName || '—',
      tracking: o.courier?.trackingNumber || '—',
    });
  });

  // --------------------------------------------------------------------------
  // SHEET 3: Expenses Ledger
  // --------------------------------------------------------------------------
  const expensesSheet = workbook.addWorksheet('Operating Expenses');
  expensesSheet.views = [{ showGridLines: true }];

  expensesSheet.columns = [
    { header: 'Expense #', key: 'expenseNumber', width: 16 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Vendor / Payee', key: 'vendor', width: 22 },
    { header: 'Payment Mode', key: 'mode', width: 16 },
    { header: 'Reference / UTR', key: 'ref', width: 20 },
    { header: 'Amount (₹)', key: 'amount', width: 15 },
  ];

  expensesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  expensesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F161E' },
  };

  expenses.forEach((e) => {
    expensesSheet.addRow({
      expenseNumber: e.expenseNumber,
      date: new Date(e.date).toLocaleDateString('en-IN'),
      title: e.title,
      category: e.category.toUpperCase().replace('_', ' '),
      vendor: e.vendorName,
      mode: e.paymentMode.toUpperCase().replace('_', ' '),
      ref: e.referenceNumber,
      amount: (e.amountPaise / 100).toFixed(2),
    });
  });

  // --------------------------------------------------------------------------
  // SHEET 4: Product Sales Performance
  // --------------------------------------------------------------------------
  const productSheet = workbook.addWorksheet('Top Products');
  productSheet.views = [{ showGridLines: true }];

  productSheet.columns = [
    { header: 'SKU', key: 'sku', width: 16 },
    { header: 'Product Title', key: 'title', width: 34 },
    { header: 'Units Sold', key: 'units', width: 14 },
    { header: 'Total Revenue (₹)', key: 'revenue', width: 18 },
  ];

  productSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  productSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD4AF37' }, // DIMSGLOW Gold
  };

  for (const prod of summary.topProducts) {
    productSheet.addRow({
      sku: prod.sku,
      title: prod.productTitle,
      units: prod.unitsSold,
      revenue: (prod.revenuePaise / 100).toFixed(2),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generates an executive-ready multi-sheet Microsoft Excel (.xlsx) workbook.
 */
export async function generateExcelReport(
  filter: ReportDateFilter,
  actorEmail: string,
  actorRole: UserRole
): Promise<Buffer> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'reports:export')) {
    throw new Error('Forbidden: Insufficient permissions to export financial reports');
  }

  const summary = await getAnalyticsSummary(filter);

  const ordersSnap = await adminDb.collection('orders').get();
  const orders: Order[] = [];
  ordersSnap.forEach((doc) => orders.push(doc.data() as Order));
  orders.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  const expensesSnap = await adminDb.collection('expenses').get();
  const expenses: Expense[] = [];
  expensesSnap.forEach((doc) => expenses.push(doc.data() as Expense));
  expenses.sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));

  return buildExcelWorkbook(summary, orders, expenses, actorEmail);
}
