'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Clock,
  User,
  Activity,
  FileCode,
  X,
  Lock,
} from 'lucide-react';
import type { AuditEvent } from '@/lib/schemas/audit';

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchAuditEvents = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/audit?action=${actionFilter}&targetType=${targetFilter}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [user, actionFilter, targetFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Immutable, append-only operational log recording privileged mutations and state transitions.
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          disabled={isLoading}
          className="p-2 border border-black/10 rounded-md hover:bg-white text-[#5D4E60] transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Target Type Filter Pills */}
      <div className="bg-white p-3.5 rounded-[10px] border border-black/10 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#1F161E] mr-2">Target Entity:</span>
        {['all', 'orders', 'purchaseOrders', 'suppliers', 'expenses', 'reviews', 'userAccess', 'invoices'].map((target) => (
          <button
            key={target}
            onClick={() => setTargetFilter(target)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition-colors cursor-pointer ${
              targetFilter === target
                ? 'bg-[#1F161E] text-white'
                : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
            }`}
          >
            {target.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Actor UID & Role</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Target ID</th>
                <th className="py-3.5 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5D4E60]">
                    <ShieldCheck className="w-8 h-8 mx-auto text-black/20 mb-2" />
                    <p className="font-semibold">No audit events found</p>
                    <p className="text-xs text-black/40 mt-0.5">
                      All privileged mutations (orders, restocks, voids, expenses) produce immutable records here.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-black/1.5 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-[#5D4E60] whitespace-nowrap font-mono text-[11px]">
                      {new Date(ev.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1F161E] block font-mono text-[11px]">
                        {ev.action}
                      </span>
                      {ev.reason && (
                        <span className="text-[10px] text-[#5D4E60] block truncate max-w-xs">
                          {ev.reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="uppercase text-[9px] font-bold">
                        {ev.actorRole}
                      </Badge>
                      <span className="text-[10px] text-[#5D4E60] font-mono block truncate max-w-30">
                        {ev.actorUid}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1F161E] capitalize">
                      {ev.targetType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#5D4E60]">
                      {ev.targetId}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-[#B83B63] font-bold hover:underline cursor-pointer flex items-center justify-end gap-1">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-black/10 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#B83B63]" />
                <h2 className="text-base font-bold text-[#1F161E] font-serif-brand">
                  Audit Record: {selectedEvent.action}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3 rounded-lg border border-black/5">
              <div>
                <span className="text-[#5D4E60] block text-[10px] uppercase font-bold">Event ID:</span>
                <span className="font-mono text-[#1F161E] font-bold">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-[#5D4E60] block text-[10px] uppercase font-bold">Correlation ID:</span>
                <span className="font-mono text-[#1F161E]">{selectedEvent.correlationId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#5D4E60] block text-[10px] uppercase font-bold">Actor UID & Role:</span>
                <span className="font-mono text-[#1F161E]">{selectedEvent.actorUid} ({selectedEvent.actorRole})</span>
              </div>
              <div>
                <span className="text-[#5D4E60] block text-[10px] uppercase font-bold">Target:</span>
                <span className="text-[#1F161E] font-semibold">{selectedEvent.targetType} / {selectedEvent.targetId}</span>
              </div>
            </div>

            {/* JSON Viewer */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-[#1F161E] block">
                Recorded Event Payload (Before & After Snapshots)
              </label>
              <pre className="p-4 bg-[#1F161E] text-[#D4AF37] rounded-lg text-[11px] font-mono overflow-x-auto max-h-72">
                {JSON.stringify(
                  {
                    action: selectedEvent.action,
                    reason: selectedEvent.reason,
                    beforeSummary: selectedEvent.beforeSummary,
                    afterSummary: selectedEvent.afterSummary,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="cursor-pointer text-xs"
              >
                Close Audit Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
