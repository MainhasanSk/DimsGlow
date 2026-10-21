'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bell,
  TrendingDown,
} from 'lucide-react';

interface LowStockAlert {
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

const severityConfig = {
  out_of_stock: {
    label: 'Out of Stock',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  low: {
    label: 'Low Stock',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
};

export default function AdminStockAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'dismissed' | 'resolved' | 'all'>('active');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchAlerts = async (refresh = false) => {
    if (!user) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const url = `/api/admin/alerts?status=${statusFilter}${refresh ? '&refresh=true' : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to load alerts.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Failed to load stock alerts.' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user, statusFilter]);

  const handleAction = async (alertId: string, action: 'dismiss' | 'resolve') => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: 'success', text: `Alert ${action}d successfully.` });
        fetchAlerts();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Action failed.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Action failed.' });
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'out_of_stock').length;
  const lowCount = alerts.filter((a) => a.severity !== 'out_of_stock').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#B83B63]" />
            Stock Low Alerts
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Real-time inventory threshold alerts. Scan inventory to detect products below reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
            className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white text-xs h-9 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Scanning...' : 'Scan Inventory'}
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
              : 'bg-[#FDF0ED] text-[#D9381E] border border-[#F5C6CB]'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="underline cursor-pointer ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 p-5 rounded-[10px] border border-red-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider block">Out of Stock</span>
            <span className="text-xl font-black text-red-700">{criticalCount}</span>
          </div>
        </div>
        <div className="bg-orange-50 p-5 rounded-[10px] border border-orange-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider block">Low Stock</span>
            <span className="text-xl font-black text-orange-700">{lowCount}</span>
          </div>
        </div>
        <div className="bg-green-50 p-5 rounded-[10px] border border-green-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider block">Total Active Alerts</span>
            <span className="text-xl font-black text-green-700">{alerts.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['active', 'resolved', 'dismissed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer ${
              statusFilter === tab
                ? 'bg-[#1F161E] text-white'
                : 'bg-white border border-black/10 text-[#5D4E60] hover:text-[#1F161E]'
            }`}
          >
            {tab === 'all' ? 'All Alerts' : tab}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Variant / SKU</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Threshold</th>
                <th className="py-3.5 px-4">Detected</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[#5D4E60] text-xs mt-2">Scanning inventory...</p>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#5D4E60]">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-400 mb-3" />
                    <p className="font-semibold text-sm">No {statusFilter !== 'all' ? statusFilter : ''} stock alerts</p>
                    <p className="text-[11px] text-black/40 mt-1">
                      All products are above their minimum stock thresholds.
                    </p>
                    <Button
                      onClick={() => fetchAlerts(true)}
                      className="mt-4 text-xs bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                    >
                      Scan Inventory Now
                    </Button>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const cfg = severityConfig[alert.severity] || severityConfig.low;
                  return (
                    <tr key={alert.id} className={`hover:bg-black/5 transition-colors ${alert.severity === 'out_of_stock' ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#1F161E] block">{alert.productName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[#5D4E60] block">{alert.variantLabel || 'Default'}</span>
                        <span className="font-mono text-[10px] text-[#8C8490]">{alert.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-black text-base ${alert.currentStock <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {alert.currentStock}
                        </span>
                        <span className="text-[10px] text-[#8C8490] block">units</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-[#5D4E60]">{alert.lowStockThreshold}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#5D4E60]">
                        {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {alert.status === 'active' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAction(alert.id, 'resolve')}
                              className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold hover:bg-green-200 transition-colors cursor-pointer"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleAction(alert.id, 'dismiss')}
                              className="px-2.5 py-1.5 bg-black/5 text-[#5D4E60] rounded-md text-[10px] font-bold hover:bg-black/10 transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                        {alert.status !== 'active' && (
                          <span className="text-[10px] text-[#8C8490] capitalize font-semibold block text-center">
                            {alert.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
