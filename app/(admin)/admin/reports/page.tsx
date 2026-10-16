'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  ShoppingBag,
  Package,
  Truck,
  RefreshCw,
  FileSpreadsheet,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/reports/reportService';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | '12m' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/reports/analytics?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setErrorMessage(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, range]);

  const handleExportExcel = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/reports/export?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to export Excel file');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DIMSGLOW_Report_${range.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Executive Analytics & Financial Intelligence
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Real-time revenue metrics, operating margins, product velocity, and certified .xlsx exports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-[#1E7E34] hover:bg-[#155724] text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Generating Excel...' : 'Export Excel (.xlsx)'}</span>
          </Button>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2 border border-black/10 rounded-[6px] hover:bg-white text-[#5D4E60] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white p-3.5 rounded-[10px] border border-black/10 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1F161E] mr-1 hidden sm:inline">Timeframe:</span>
          {[
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' },
            { key: '12m', label: 'Last 12 Months' },
            { key: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setRange(item.key as any)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                range === item.key
                  ? 'bg-[#1F161E] text-white'
                  : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#5D4E60] flex items-center gap-1 font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Period: {analytics?.periodLabel || range.toUpperCase()}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-[#FDF0ED] border border-[#F5C6CB] text-[#D9381E] rounded-[8px] text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* 5 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Net Revenue */}
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[#B83B63]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5D4E60]">
              Net Sales Revenue
            </span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#1F161E]">
            ₹{((analytics?.totalNetRevenuePaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#5D4E60]">
            Gross: ₹{((analytics?.totalGrossRevenuePaise || 0) / 100).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Orders Volume */}
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[#1E7E34]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5D4E60]">
              Completed Orders
            </span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#1F161E]">
            {analytics?.totalOrdersCount || 0}
          </div>
          <p className="text-[10px] text-[#1E7E34]">
            {analytics?.deliveredOrdersCount || 0} delivered
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[#D4AF37]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5D4E60]">
              Average Order Value
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#1F161E]">
            ₹{((analytics?.averageOrderValuePaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#5D4E60]">Per successful cart</p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[#EF4444]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5D4E60]">
              Disbursed Expenses
            </span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#1F161E]">
            ₹{((analytics?.totalExpensePaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#5D4E60]">Packaging, ads & freight</p>
        </div>

        {/* Operating Profit */}
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[#1E7E34]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5D4E60]">
              Operating Margin
            </span>
            <PieChart className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#1E7E34]">
            ₹{((analytics?.operatingProfitPaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#5D4E60]">Net Revenue - Expenses</p>
        </div>
      </div>

      {/* Visual Chart & Order Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Bar Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[12px] border border-black/10 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-black/5">
            <div>
              <h3 className="font-bold text-[#1F161E] text-sm font-serif-brand">
                Revenue & Expense Trend
              </h3>
              <p className="text-xs text-[#5D4E60]">Sales cashflow vs daily overhead disbursements</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-[#B83B63]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B83B63]" /> Sales
              </span>
              <span className="flex items-center gap-1.5 text-black/40">
                <span className="w-2.5 h-2.5 rounded-full bg-black/30" /> Expenses
              </span>
            </div>
          </div>

          {/* Simple Dynamic SVG / CSS Bars */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {(!analytics?.dailyTrends || analytics.dailyTrends.length === 0) ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#5D4E60]">
                No sales data recorded in this period.
              </div>
            ) : (
              (() => {
                const maxVal = Math.max(
                  ...analytics.dailyTrends.map((t) => Math.max(t.revenuePaise, t.expensePaise)),
                  100000 // minimum 1000 INR scale
                );

                return analytics.dailyTrends.map((day, idx) => {
                  const revHeightPct = Math.max(4, Math.round((day.revenuePaise / maxVal) * 100));
                  const expHeightPct = Math.max(4, Math.round((day.expensePaise / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeightPct}%` }}
                          className="w-full max-w-[14px] bg-[#B83B63] rounded-t-[3px] group-hover:bg-[#9B2C4F] transition-all relative"
                          title={`${day.dateLabel}: Revenue ₹${(day.revenuePaise / 100).toLocaleString('en-IN')}`}
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expHeightPct}%` }}
                          className="w-full max-w-[14px] bg-black/20 rounded-t-[3px] group-hover:bg-black/40 transition-all relative"
                          title={`${day.dateLabel}: Expense ₹${(day.expensePaise / 100).toLocaleString('en-IN')}`}
                        />
                      </div>
                      <span className="text-[9px] text-[#5D4E60] font-mono truncate max-w-[36px]">
                        {day.dateLabel}
                      </span>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-[12px] border border-black/10 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#1F161E] text-sm font-serif-brand pb-3 border-b border-black/5">
              Order Pipeline Distribution
            </h3>
            <div className="space-y-3 pt-3">
              {[
                { key: 'delivered', label: 'Delivered', color: 'bg-[#1E7E34]' },
                { key: 'shipped', label: 'In Transit (Shipped)', color: 'bg-[#0066CC]' },
                { key: 'confirmed', label: 'Confirmed / Packing', color: 'bg-[#D4AF37]' },
                { key: 'placed', label: 'New Unconfirmed', color: 'bg-[#B83B63]' },
                { key: 'cancelled', label: 'Cancelled / Voided', color: 'bg-[#EF4444]' },
              ].map((st) => {
                const count = analytics?.ordersByStatus?.[st.key] || 0;
                const total = analytics?.totalOrdersCount || 1;
                const pct = Math.round((count / (total || 1)) * 100);

                return (
                  <div key={st.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#1F161E]">{st.label}</span>
                      <span className="font-bold text-[#1F161E]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${st.color} rounded-full transition-all`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 text-center">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1E7E34]" />
              <span>Download Excel Backup</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Performing Products Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-black/5 flex justify-between items-center">
          <h3 className="font-bold text-[#1F161E] text-sm font-serif-brand">
            Top Performing Formulations & Products
          </h3>
          <span className="text-xs text-[#5D4E60]">Ranked by total revenue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product Title</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(!analytics?.topProducts || analytics.topProducts.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5D4E60]">
                    No product sales recorded in this timeframe.
                  </td>
                </tr>
              ) : (
                analytics.topProducts.map((p, idx) => (
                  <tr key={p.sku} className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#B83B63]">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1F161E]">
                      {p.productTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5D4E60]">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#1F161E]">
                      {p.unitsSold}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#1F161E]">
                      ₹{(p.revenuePaise / 100).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
