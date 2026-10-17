'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  ShoppingBag,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Plus,
  Tag,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import type { CrmCustomerProfile, CrmStaffNote, CustomerTag } from '@/lib/schemas/operations';

export default function AdminCrmPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CrmCustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');

  // Selected customer for detail drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomerProfile | null>(null);
  const [notes, setNotes] = useState<CrmStaffNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/crm?tag=${tagFilter}&search=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err: any) {
      console.error('Error fetching CRM customers:', err);
      setFeedbackMessage({ type: 'error', text: 'Failed to load customer profiles.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user, tagFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openCustomerDrawer = async (cust: CrmCustomerProfile) => {
    setSelectedCustomer(cust);
    if (!user) return;
    setIsLoadingNotes(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/crm/${cust.uid}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCustomer || !newNoteText.trim()) return;
    setIsSubmittingNote(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/crm/${selectedCustomer.uid}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newNoteText }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setNotes([data.note, ...notes]);
      setNewNoteText('');
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleToggleTag = async (tagToToggle: CustomerTag) => {
    if (!user || !selectedCustomer) return;
    const currentTags = selectedCustomer.tags || [];
    const hasTag = currentTags.includes(tagToToggle);
    const updatedTags = hasTag
      ? currentTags.filter((t) => t !== tagToToggle)
      : [...currentTags, tagToToggle];

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/crm/${selectedCustomer.uid}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: updatedTags }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedCustomer({ ...selectedCustomer, tags: updatedTags });
        setCustomers(
          customers.map((c) => (c.uid === selectedCustomer.uid ? { ...c, tags: updatedTags } : c))
        );
      }
    } catch (err: any) {
      console.error('Error updating tag:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Client Relationship Management (CRM)
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Customer 360 profiles, lifetime value (LTV), private internal notes, and VIP curation.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="p-2 border border-black/10 rounded-md hover:bg-white text-[#5D4E60] transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-[10px] border border-black/10 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['all', 'vip', 'repeat_buyer', 'new_shopper', 'wholesale'].map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition-colors cursor-pointer ${
                tagFilter === tag
                  ? 'bg-[#1F161E] text-white'
                  : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
              }`}
            >
              {tag.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-8 pr-3 py-1.5 border border-black/20 rounded-md text-xs bg-[#FAF8F5] focus:bg-white transition-colors"
            />
          </div>
          <Button type="submit" size="sm" className="bg-[#B83B63] text-white text-xs cursor-pointer h-8">
            Filter
          </Button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Lifetime Value (LTV)</th>
                <th className="py-3.5 px-4">Avg Order Value</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5D4E60]">
                    <Users className="w-8 h-8 mx-auto text-black/20 mb-2" />
                    <p className="font-semibold">No clients matching criteria</p>
                  </td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const isVip = cust.tags.includes('vip');

                  return (
                    <tr
                      key={cust.uid}
                      onClick={() => openCustomerDrawer(cust)}
                      className="hover:bg-black/2 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F161E]">{cust.displayName}</span>
                          {isVip && (
                            <span className="p-0.5 bg-[#D4AF37]/20 text-[#9E7B15] rounded-full" title="VIP Client">
                              <Crown className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#5D4E60]">
                        <span className="block text-[#1F161E] font-medium">{cust.email}</span>
                        {cust.phone && <span className="text-[11px] block">{cust.phone}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1F161E]">
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#1F161E]">
                        ₹{(cust.lifetimeValuePaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-[#5D4E60] font-medium">
                        ₹{(cust.averageOrderValuePaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {cust.tags.map((t) => (
                            <Badge
                              key={t}
                              variant={t === 'vip' ? 'warning' : 'outline'}
                              className="text-[9px] uppercase font-bold px-1.5 py-0.5"
                            >
                              {t.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-[#B83B63] font-bold text-xs hover:underline">
                          View 360°
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLIENT 360 DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-black/10">
            {/* Drawer Header */}
            <div className="p-5 border-b border-black/10 bg-[#FAF8F5] sticky top-0 z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#1F161E] font-serif-brand">
                    {selectedCustomer.displayName}
                  </h2>
                  {selectedCustomer.tags.includes('vip') && (
                    <Badge variant="warning" className="gap-1 text-[10px]">
                      <Crown className="w-3 h-3" />
                      <span>VIP CLIENT</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#5D4E60] mt-0.5">{selectedCustomer.email}</p>
                {selectedCustomer.phone && (
                  <p className="text-xs text-[#5D4E60]">{selectedCustomer.phone}</p>
                )}
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#5D4E60] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-6 flex-1">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-black/10 text-center">
                  <span className="text-[10px] text-[#5D4E60] uppercase block font-bold">LTV</span>
                  <span className="text-sm font-black text-[#1F161E] block mt-0.5">
                    ₹{(selectedCustomer.lifetimeValuePaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-black/10 text-center">
                  <span className="text-[10px] text-[#5D4E60] uppercase block font-bold">Orders</span>
                  <span className="text-sm font-black text-[#1F161E] block mt-0.5">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-black/10 text-center">
                  <span className="text-[10px] text-[#5D4E60] uppercase block font-bold">AOV</span>
                  <span className="text-sm font-black text-[#1F161E] block mt-0.5">
                    ₹{(selectedCustomer.averageOrderValuePaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Tag Management */}
              <div>
                <label className="text-xs font-bold text-[#1F161E] block mb-2">
                  Client Tags & VIP Status (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['vip', 'repeat_buyer', 'wholesale', 'high_return_risk', 'new_shopper'] as CustomerTag[]).map(
                    (tag) => {
                      const isActive = selectedCustomer.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-[#B83B63] text-white border-[#B83B63]'
                              : 'bg-white text-[#5D4E60] border-black/15 hover:border-black/30'
                          }`}
                        >
                          {tag.replace('_', ' ')}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1F161E] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#B83B63]" />
                    <span>Private Staff Notes</span>
                  </label>
                  <span className="text-[11px] text-[#5D4E60]">Visible only to operations staff</span>
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Record notes on delivery preferences, custom shade requests, or gifting instructions..."
                    className="w-full px-3 py-2 border border-black/20 rounded-md text-xs bg-white"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      size="sm"
                      className="bg-[#1F161E] hover:bg-black text-white text-xs cursor-pointer h-7"
                    >
                      {isSubmittingNote ? 'Saving...' : 'Add Note'}
                    </Button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2 mt-3">
                  {isLoadingNotes ? (
                    <p className="text-xs text-[#5D4E60]">Loading staff notes...</p>
                  ) : notes.length === 0 ? (
                    <div className="p-4 bg-[#FAF8F5] rounded-lg text-center text-xs text-[#5D4E60]">
                      No staff notes recorded yet for this client.
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-[#FAF8F5] rounded-lg border border-black/5 space-y-1 text-xs"
                      >
                        <p className="text-[#1F161E] font-medium">{note.text}</p>
                        <div className="flex justify-between text-[10px] text-[#5D4E60] pt-1">
                          <span>
                            By {note.authorName} ({note.authorRole})
                          </span>
                          <span>
                            {new Date(note.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-black/10 bg-[#FAF8F5] flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
                className="cursor-pointer text-xs"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
