'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  Plus,
  RefreshCw,
  IndianRupee,
  CreditCard,
  Building,
  TrendingDown,
  PieChart,
  Tag,
  Calendar,
} from 'lucide-react';
import type { Expense, ExpenseCategory, PaymentMode } from '@/lib/schemas/operations';

const EXPENSE_CATEGORIES: Array<{ key: ExpenseCategory; label: string }> = [
  { key: 'packaging', label: 'Packaging & Cartons' },
  { key: 'logistics', label: 'Courier & Logistics' },
  { key: 'marketing', label: 'Marketing & Ad Spend' },
  { key: 'software', label: 'Software & Infrastructure' },
  { key: 'office', label: 'Office Supplies & Rent' },
  { key: 'utilities', label: 'Utilities & Power' },
  { key: 'inventory_transport', label: 'Inventory Freight' },
  { key: 'other', label: 'Miscellaneous' },
];

export default function AdminExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{
    totalExpensePaise: number;
    byCategory: Record<string, number>;
    expenseCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Form
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'packaging' as ExpenseCategory,
    amountRupees: '',
    paymentMode: 'upi' as PaymentMode,
    vendorName: '',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchExpenses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/expenses?category=${categoryFilter}&includeSummary=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setFeedbackMessage({ type: 'error', text: 'Failed to load expense records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, categoryFilter]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const amountPaise = Math.round(parseFloat(newExpense.amountRupees) * 100);
      if (isNaN(amountPaise) || amountPaise <= 0) {
        throw new Error('Please enter a valid expense amount');
      }

      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newExpense.title.trim(),
          category: newExpense.category,
          amountPaise,
          paymentMode: newExpense.paymentMode,
          vendorName: newExpense.vendorName.trim(),
          referenceNumber: newExpense.referenceNumber.trim(),
          date: new Date(newExpense.date).getTime(),
          notes: newExpense.notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({
        type: 'success',
        text: `Expense ${data.expense.expenseNumber} recorded successfully.`,
      });
      setIsRecordExpenseOpen(false);
      setNewExpense({
        title: '',
        category: 'packaging',
        amountRupees: '',
        paymentMode: 'upi',
        vendorName: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchExpenses();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to record expense.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Operational Expenses & Cost Ledger
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Track overhead costs, logistics disbursements, packaging runs, and marketing investments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsRecordExpenseOpen(true)}
            className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </Button>

          <button
            onClick={fetchExpenses}
            disabled={isLoading}
            className="p-2 border border-black/10 rounded-[6px] hover:bg-white text-[#5D4E60] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-[8px] text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
              : 'bg-[#FDF0ED] text-[#D9381E] border border-[#F5C6CB]'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-current underline cursor-pointer ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#B83B63]/10 text-[#B83B63] flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5D4E60] tracking-wider block">
              Total Expenses
            </span>
            <span className="text-xl font-black text-[#1F161E]">
              ₹{((summary?.totalExpensePaise || 0) / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#1E7E34]/10 text-[#1E7E34] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5D4E60] tracking-wider block">
              Recorded Entries
            </span>
            <span className="text-xl font-black text-[#1F161E]">
              {summary?.expenseCount || expenses.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#9E7B15] flex items-center justify-center shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5D4E60] tracking-wider block">
              Top Category
            </span>
            <span className="text-sm font-bold text-[#1F161E] capitalize">
              {summary?.byCategory
                ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace('_', ' ') || 'None'
                : 'Packaging'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-[8px] border border-black/10 shadow-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-[#1F161E] text-white'
              : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
              categoryFilter === cat.key
                ? 'bg-[#B83B63] text-white'
                : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3.5 px-4">Ref / Number</th>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payee / Vendor</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5D4E60]">
                    <Receipt className="w-8 h-8 mx-auto text-black/20 mb-2" />
                    <p className="font-semibold">No expense records found</p>
                    <p className="text-[11px] text-black/40 mt-0.5">
                      Record operating expenses to maintain an accurate general ledger.
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1F161E]">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1F161E] block">{exp.title}</span>
                      {exp.notes && (
                        <span className="text-[10px] text-[#5D4E60] block truncate max-w-xs">
                          {exp.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {exp.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1F161E]">
                      {exp.vendorName}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-[#5D4E60]">
                      {exp.paymentMode.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-[#5D4E60]">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#1F161E]">
                      ₹{(exp.amountPaise / 100).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD EXPENSE */}
      {isRecordExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[12px] p-6 max-w-lg w-full shadow-2xl border border-black/10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h2 className="text-base font-bold text-[#1F161E] font-serif-brand">
                Record Operational Expenditure
              </h2>
              <button
                onClick={() => setIsRecordExpenseOpen(false)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="e.g. 5,000 Luxury Embossed Courier Boxes"
                  className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newExpense.amountRupees}
                    onChange={(e) => setNewExpense({ ...newExpense, amountRupees: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Payment Mode *</label>
                  <select
                    value={newExpense.paymentMode}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                    <option value="credit_card">Corporate Credit Card</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Disbursement Date *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Payee / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={newExpense.vendorName}
                    onChange={(e) => setNewExpense({ ...newExpense, vendorName: e.target.value })}
                    placeholder="e.g. Blue Dart Express Ltd"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">UTR / Invoice / Ref Number *</label>
                  <input
                    type="text"
                    required
                    value={newExpense.referenceNumber}
                    onChange={(e) => setNewExpense({ ...newExpense, referenceNumber: e.target.value })}
                    placeholder="e.g. UTR198273641 or INV-789"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  placeholder="Optional notes regarding approval, invoice link, or accounting ledger code"
                  className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRecordExpenseOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
