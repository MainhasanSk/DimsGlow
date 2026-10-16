'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/schemas/invoice';
import {
  FileText,
  Search,
  Download,
  CheckCircle2,
  AlertOctagon,
  ArrowUpDown,
  RefreshCw,
  Building,
  ShieldAlert,
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'voided'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInvoices = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const idToken = await user.getIdToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      } else {
        setErrorMsg(data.error || 'Failed to load invoices');
      }
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setErrorMsg('Network error while fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user, statusFilter]);

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (!user) return;
    setDownloadingId(invoice.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/orders/${invoice.orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Cannot download invoice: ${errData.error || 'Ineligible'}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalInvoicedPaise = invoices
    .filter((inv) => inv.status === 'active')
    .reduce((sum, inv) => sum + inv.totalPaise, 0);
  const activeCount = invoices.filter((inv) => inv.status === 'active').length;
  const voidedCount = invoices.filter((inv) => inv.status === 'voided').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19161A]">Tax Invoices & Finance</h1>
          <p className="text-sm text-[#737373] mt-1">
            Official statutory GST tax invoices snapshotted on order confirmation with audit trails and credit notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Active Invoiced Volume
            </span>
            <FileText className="w-4 h-4 text-[#5B132B]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#19161A]">
            ₹{(totalInvoicedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-[#737373] mt-1">Total revenue backed by statutory GST invoices</p>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Active Invoices
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#19161A]">{activeCount}</div>
          <p className="text-xs text-[#737373] mt-1">Valid invoices eligible for customer download</p>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Voided / Credit Notes
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#19161A]">{voidedCount}</div>
          <p className="text-xs text-[#737373] mt-1">Preserved for audit; blocked from customer download</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'voided'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#5B132B] text-white shadow-sm'
                  : 'text-[#737373] hover:text-[#19161A] hover:bg-[#F9F7F5]'
              }`}
            >
              {st} Invoices
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadInvoices();
          }}
          className="flex items-center gap-2 w-full md:w-80"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice or order #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B132B]"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="text-xs">
            Filter
          </Button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#737373] text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#5B132B]" />
            Loading official tax invoices...
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-rose-600 text-sm">{errorMsg}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#C4C4C4] mx-auto" />
            <h3 className="text-sm font-semibold text-[#19161A]">No Invoices Found</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Invoices are automatically allocated and immutably snapshotted whenever orders are confirmed by staff.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EBEBEB] text-[#737373] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Taxable</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FCFBF9] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#5B132B]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#737373]">
                      {inv.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#19161A]">{inv.buyer.fullName}</div>
                      <div className="text-[11px] text-[#737373]">
                        {inv.buyer.city}, {inv.buyer.state}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#737373]">
                      {new Date(inv.issueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#737373]">
                      ₹{(inv.subtotalPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#19161A]">
                      ₹{(inv.totalPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === 'active' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      ) : (
                        <div>
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            Voided
                          </Badge>
                          {inv.creditNoteReference && (
                            <div className="text-[10px] text-[#737373] mt-0.5 font-mono">
                              CRN: {inv.creditNoteReference}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === inv.id}
                        onClick={() => handleDownloadPdf(inv)}
                        className="text-xs h-7 px-2.5 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-[#5B132B]" />
                        {downloadingId === inv.id ? 'Generating...' : 'PDF'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
