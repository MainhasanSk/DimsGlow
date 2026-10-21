'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  Lock,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { StaffRole, ROLE_DEFAULT_PERMISSIONS, UserAccessRecord } from '@/lib/auth/roles';

const STAFF_ROLES: Array<{ role: StaffRole; label: string; description: string }> = [
  { role: 'owner', label: 'Store Owner', description: 'Unrestricted master access to all financial, order, inventory and staff operations.' },
  { role: 'admin', label: 'Executive Administrator', description: 'Full operational management of catalog, orders, stock, CRM and reports.' },
  { role: 'order_manager', label: 'Fulfillment & Order Manager', description: 'Handles order dispatch, courier AWB tracking, packing and status updates.' },
  { role: 'inventory_manager', label: 'Inventory & Procurement Manager', description: 'Procures POs, restocks inventory, manages supplier catalogue and stock.' },
  { role: 'finance_manager', label: 'Finance & Tax Accountant', description: 'Manages expenses, manual payments, refunds, GST invoices and financial exports.' },
  { role: 'support_manager', label: 'Client Support Manager', description: 'Reviews customer profiles, moderates reviews, manages CRM notes.' },
  { role: 'analyst_readonly', label: 'Read-Only Business Analyst', description: 'Audit and analytical reporting visibility with zero write permissions.' },
];

export default function AdminStaffPage() {
  const { user, role } = useAuth();
  const [staffList, setStaffList] = useState<Array<UserAccessRecord & { email?: string; displayName?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('order_manager');

  const fetchStaff = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to load staff list' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({ type: 'success', text: data.message });
      setIsInviteOpen(false);
      setInviteEmail('');
      fetchStaff();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to assign role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffUid: string, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmPrompt = confirm(`Are you sure you want to mark this staff member as ${newStatus}?`);
    if (!confirmPrompt) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: staffUid,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({ type: 'success', text: data.message });
      fetchStaff();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  if (role && !['owner', 'admin'].includes(role)) {
    return (
      <div className="p-8 bg-white rounded-xl border border-[#E8E2E7] text-center max-w-lg mx-auto my-12 space-y-3">
        <Lock className="w-12 h-12 text-[#B83B63] mx-auto opacity-70" />
        <h2 className="text-lg font-serif font-bold text-[#19161A]">Access Restricted: Admin Only</h2>
        <p className="text-xs text-[#6D6670] leading-relaxed">
          Staff credential provisioning and role permissions management are restricted to Store Owners and Executive Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Cryptographically enforced least-privilege matrix. Client cannot elevate permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Staff Member</span>
          </Button>

          <button
            onClick={fetchStaff}
            disabled={isLoading}
            className="p-2 border border-black/10 rounded-md hover:bg-white text-[#5D4E60] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between ${
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

      {/* Active Staff Table */}
      <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-black/5 flex justify-between items-center">
          <h3 className="font-bold text-[#1F161E] text-sm font-serif-brand">
            Authorized Personnel Directory
          </h3>
          <span className="text-xs text-[#5D4E60]">
            {staffList.length} provisioned staff account{staffList.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Permissions Granted</th>
                <th className="py-3.5 px-4">Provisioned Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5D4E60]">
                    <Users className="w-8 h-8 mx-auto text-black/20 mb-2" />
                    <p className="font-semibold">No additional staff members provisioned</p>
                    <p className="text-xs text-black/40 mt-0.5">
                      The primary store owner is authenticated via Firebase Auth bootstrap.
                    </p>
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.uid} className="hover:bg-black/1.5 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1F161E] block">
                        {st.displayName || st.email?.split('@')[0]}
                      </span>
                      <span className="text-[11px] text-[#5D4E60] font-mono block">
                        {st.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={st.role === 'owner' ? 'warning' : 'outline'}
                        className="uppercase font-bold text-[10px]"
                      >
                        {st.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={st.status === 'active' ? 'success' : 'outline'}
                        className="capitalize text-[10px]"
                      >
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#5D4E60]">
                      <span className="font-semibold text-[#1F161E]">
                        {st.permissions?.length || 0} permissions
                      </span>
                      <span className="text-[10px] text-black/40 block truncate max-w-xs">
                        {st.permissions?.slice(0, 3).join(', ')}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5D4E60]">
                      {new Date(st.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {st.role !== 'owner' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(st.uid, st.status)}
                          className={`text-xs h-7 px-2.5 cursor-pointer ${
                            st.status === 'active'
                              ? 'text-[#EF4444] hover:bg-[#FDF0ED] border-[#EF4444]/30'
                              : 'text-[#1E7E34] hover:bg-[#EBF7EE] border-[#1E7E34]/30'
                          }`}
                        >
                          {st.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix Reference Card */}
      <div className="bg-[#FAF8F5] p-5 rounded-xl border border-black/10 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F161E] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#B83B63]" />
          <span>Role Privilege Reference Guide</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAFF_ROLES.map((r) => (
            <div key={r.role} className="bg-white p-3 rounded-lg border border-black/5 text-xs space-y-1">
              <span className="font-bold text-[#1F161E] block">{r.label}</span>
              <p className="text-[11px] text-[#5D4E60] leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: PROVISION STAFF MEMBER */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-black/10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h2 className="text-base font-bold text-[#1F161E] font-serif-brand">
                Provision Operational Staff Member
              </h2>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantRole} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Staff Member Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@dimsglow.com"
                  className="w-full px-3 py-2 border border-black/20 rounded-md bg-white text-xs"
                />
                <p className="text-[10px] text-[#5D4E60] mt-1">
                  The staff member must register a baseline DIMSGLOW account first.
                </p>
              </div>

              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Operational Role *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 border border-black/20 rounded-md bg-white text-xs"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-md border border-black/10 text-[11px] text-[#5D4E60] space-y-1">
                <span className="font-bold text-[#1F161E] block">Permissions that will be granted:</span>
                <p className="text-[10px] font-mono leading-relaxed">
                  {ROLE_DEFAULT_PERMISSIONS[selectedRole]?.join(', ') || 'No write permissions'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                >
                  {isSubmitting ? 'Granting Role...' : 'Assign Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
