'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { MapPin, Plus, Trash2, Edit2, Check, ShieldCheck, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export interface SavedAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: 'India';
  isDefault: boolean;
  addressType?: 'home' | 'work' | 'other';
  createdAt: number;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other',
];

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState(INDIAN_STATES[0]);
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        collection(db, 'addresses', user.uid, 'savedAddresses')
      );
      const list: SavedAddress[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as SavedAddress);
      });
      list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      setAddresses(list);
    } catch (err) {
      console.warn('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName('');
    setPhoneNumber('');
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
    setCity('');
    setState('Delhi');
    setPostalCode('');
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setPhoneNumber(addr.phoneNumber);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    // Validate
    if (!fullName.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setFormError('Please fill in all mandatory address fields');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      setFormError('Please enter a valid 10-digit mobile phone number');
      return;
    }
    if (!/^\d{6}$/.test(postalCode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setSubmitting(true);
    try {
      const addrId = editingAddress?.id || `addr_${Date.now()}`;
      const batch = writeBatch(db);

      // If this address is set as default, remove default flag from other addresses
      if (isDefault) {
        addresses.forEach((existing) => {
          if (existing.id !== addrId && existing.isDefault) {
            const ref = doc(db, 'addresses', user.uid, 'savedAddresses', existing.id);
            batch.update(ref, { isDefault: false });
          }
        });
      }

      const addressData: SavedAddress = {
        id: addrId,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state,
        postalCode: postalCode.trim(),
        country: 'India',
        isDefault: isDefault || addresses.length === 0,
        createdAt: editingAddress?.createdAt || Date.now(),
      };

      const targetRef = doc(db, 'addresses', user.uid, 'savedAddresses', addrId);
      batch.set(targetRef, addressData, { merge: true });
      await batch.commit();

      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err: any) {
      console.error('Error saving address:', err);
      setFormError(err.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await deleteDoc(doc(db, 'addresses', user.uid, 'savedAddresses', addrId));
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefault = async (addrId: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      addresses.forEach((a) => {
        const ref = doc(db, 'addresses', user.uid, 'savedAddresses', a.id);
        batch.update(ref, { isDefault: a.id === addrId });
      });
      await batch.commit();
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E8E2E7] gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#19161A]">
            Saved Shipping Addresses
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Manage your verified Pan-India delivery addresses for fast checkout.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E8E2E7] p-8">
          <MapPin className="w-12 h-12 text-[#8C8490] mx-auto opacity-30 mb-3" />
          <h3 className="text-base font-serif font-bold text-[#19161A]">No addresses saved yet</h3>
          <p className="text-xs text-[#6D6670] max-w-sm mx-auto mt-1 mb-5">
            Add your primary shipping destination to enjoy 1-click express checkout.
          </p>
          <Button variant="primary" size="sm" onClick={openAddModal} className="text-xs font-bold">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-xl border bg-white flex flex-col justify-between transition-all ${
                addr.isDefault
                  ? 'border-[#B83B63] ring-1 ring-[#B83B63] shadow-xs'
                  : 'border-[#E8E2E7] hover:border-[#B83B63]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-[#19161A] line-clamp-1">
                    {addr.fullName}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded-sm shrink-0">
                      Default
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#6D6670] space-y-0.5 leading-relaxed">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && <p className="italic text-[#8C8490]">Landmark: {addr.landmark}</p>}
                  <p className="font-semibold text-[#19161A]">
                    {addr.city}, {addr.state} — {addr.postalCode}
                  </p>
                  <p className="pt-1 text-[#19161A]">Phone: +91 {addr.phoneNumber}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-[#E8E2E7] flex items-center justify-between gap-2 text-xs">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[#6D6670] hover:text-[#B83B63] font-semibold text-[11px] underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="text-[#6D6670] hover:text-[#19161A] p-1 transition-colors cursor-pointer"
                    aria-label="Edit address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-[#8C8490] hover:text-[#EF4444] p-1 transition-colors cursor-pointer"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Shipping Address'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-md text-xs text-[#EF4444]">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                Full Name *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Receiver full name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                10-Digit Mobile Number *
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#19161A] mb-1">
              Flat, House No., Building, Apartment *
            </label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g. Flat 402, Royal Palms"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#19161A] mb-1">
              Area, Colony, Street, Sector
            </label>
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="e.g. Park Road, Indiranagar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                City / Town *
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Guwahati"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-10 px-3 border border-[#E8E2E7] rounded-md text-xs font-medium text-[#19161A] bg-white focus:outline-none focus:border-[#B83B63]"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                6-Digit PIN Code *
              </label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="781001"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#19161A] mb-1">
              Landmark (Optional)
            </label>
            <Input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near City Center Mall"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
            />
            <span className="text-xs text-[#19161A] font-medium">
              Make this my default shipping address
            </span>
          </label>

          <div className="pt-4 border-t border-[#E8E2E7] flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="font-bold text-xs"
            >
              {submitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
