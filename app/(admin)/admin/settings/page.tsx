'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Truck,
  Building,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Clock,
  Sparkles,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DEFAULT_SITE_SETTINGS,
  type SiteStoreSettings,
} from '@/lib/schemas/settings';
import {
  getStoreSettings,
  saveStoreSettings,
} from '@/lib/settings/settingsService';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'shipping' | 'footer' | 'announcements' | 'tax'>('shipping');
  const [settings, setSettings] = useState<SiteStoreSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load from Firestore on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getStoreSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings from Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const updated = await saveStoreSettings(settings);
      setSettings(updated);
      setSaveStatus({
        type: 'success',
        message: 'Settings successfully committed to Firebase Firestore in real-time!',
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setSaveStatus({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all store settings to default values?')) {
      setSettings(DEFAULT_SITE_SETTINGS);
      setSaveStatus({
        type: 'success',
        message: 'Reset to defaults. Click "Save All Changes" to sync to Firestore.',
      });
    }
  };

  const addAnnouncement = () => {
    setSettings((prev) => ({
      ...prev,
      announcements: [...(prev.announcements || []), 'NEW PROMO: Free gift with your order!'],
    }));
  };

  const updateAnnouncement = (index: number, val: string) => {
    setSettings((prev) => {
      const copy = [...(prev.announcements || [])];
      copy[index] = val;
      return { ...prev, announcements: copy };
    });
  };

  const removeAnnouncement = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      announcements: (prev.announcements || []).filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#B83B63]" />
          <p className="text-sm font-medium text-[#6D6670]">Loading settings from Firebase Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2E7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif-brand text-[#19161A]">Store & Operations Settings</h1>
            <Badge variant="outline" className="text-xs bg-[#FAF8FA]">Firestore Synced</Badge>
          </div>
          <p className="text-xs text-[#6D6670] mt-1">
            Centrally manage delivery charges, free delivery thresholds, footer contact details, GSTIN, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="text-xs border-[#E8E2E7]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Defaults
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="text-xs min-w-32"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Notification */}
      {saveStatus && (
        <div
          className={`p-4 rounded-md flex items-center gap-3 border text-xs ${
            saveStatus.type === 'success'
              ? 'bg-[#EBF7EE] text-[#18794E] border-[#AEE2BE]'
              : 'bg-[#FDF2F2] text-[#B42318] border-[#F8B4B4]'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-[#E8E2E7] gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'shipping'
              ? 'border-[#B83B63] text-[#B83B63] bg-[#FAF8FA]'
              : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
          }`}
        >
          <Truck className="w-4 h-4" />
          Shipping & Delivery Charges
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'footer'
              ? 'border-[#B83B63] text-[#B83B63] bg-[#FAF8FA]'
              : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
          }`}
        >
          <Building className="w-4 h-4" />
          Footer & Brand Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-[#B83B63] text-[#B83B63] bg-[#FAF8FA]'
              : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Announcements & Offer Strip
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tax'
              ? 'border-[#B83B63] text-[#B83B63] bg-[#FAF8FA]'
              : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Tax, GST & Invoicing
        </button>
      </div>

      {/* Tab 1: Shipping & Delivery Settings */}
      {activeTab === 'shipping' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#E8E2E7]">
              <CardContent className="p-6 space-y-5">
                <div className="border-b border-[#E8E2E7] pb-3">
                  <h3 className="text-sm font-bold text-[#19161A] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#B83B63]" />
                    Delivery Rules & Offer Thresholds
                  </h3>
                  <p className="text-xs text-[#6D6670]">
                    These rates directly control the cart checkout fee calculations and storefront progress bars.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">
                      Free Delivery Threshold (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#6D6670] font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={settings.freeDeliveryThresholdRupees}
                        onChange={(e) =>
                          setSettings({ ...settings, freeDeliveryThresholdRupees: Number(e.target.value) || 0 })
                        }
                        className="pl-7"
                      />
                    </div>
                    <p className="text-[10px] text-[#6D6670]">
                      Orders above this amount qualify for ₹0 free shipping across India.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">
                      Standard Delivery Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#6D6670] font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={settings.standardShippingFeeRupees}
                        onChange={(e) =>
                          setSettings({ ...settings, standardShippingFeeRupees: Number(e.target.value) || 0 })
                        }
                        className="pl-7"
                      />
                    </div>
                    <p className="text-[10px] text-[#6D6670]">
                      Applied when order value is below the free shipping threshold.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E8E2E7]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#19161A]">
                        Cash on Delivery (COD)
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.codAvailable}
                        onChange={(e) => setSettings({ ...settings, codAvailable: e.target.checked })}
                        className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#6D6670] font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        disabled={!settings.codAvailable}
                        value={settings.codFeeRupees}
                        onChange={(e) => setSettings({ ...settings, codFeeRupees: Number(e.target.value) || 0 })}
                        className="pl-7"
                      />
                    </div>
                    <p className="text-[10px] text-[#6D6670]">
                      Additional COD handling fee (set to 0 for free COD).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#19161A]">
                        Express 24-48h Delivery
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.expressDeliveryAvailable}
                        onChange={(e) => setSettings({ ...settings, expressDeliveryAvailable: e.target.checked })}
                        className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#6D6670] font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        disabled={!settings.expressDeliveryAvailable}
                        value={settings.expressDeliveryFeeRupees}
                        onChange={(e) =>
                          setSettings({ ...settings, expressDeliveryFeeRupees: Number(e.target.value) || 0 })
                        }
                        className="pl-7"
                      />
                    </div>
                    <p className="text-[10px] text-[#6D6670]">
                      Priority air-shipping surcharge.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#E8E2E7]">
                  <label className="text-xs font-semibold text-[#19161A]">
                    Delivery Offer Promo Banner Headline
                  </label>
                  <Input
                    value={settings.deliveryOfferBanner}
                    onChange={(e) => setSettings({ ...settings, deliveryOfferBanner: e.target.value })}
                    placeholder="e.g. FREE SHIPPING ON ORDERS ABOVE ₹399 • DISPATCH WITHIN 24 HOURS"
                  />
                  <p className="text-[10px] text-[#6D6670]">
                    Appears across product cards, hero ribbons, and checkout guarantee strips.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Preview */}
          <div className="space-y-4">
            <div className="p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#19161A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B83B63]" /> Storefront Preview
              </h4>

              {/* Cart Drawer Free Delivery Meter Preview */}
              <div className="bg-white p-4 rounded-md border border-[#E8E2E7] space-y-2">
                <p className="text-xs font-bold text-[#19161A]">Cart Drawer Free Delivery Meter</p>
                <div className="flex items-center justify-between text-[11px] text-[#18794E] font-semibold">
                  <span>Add ₹150 more for FREE Delivery</span>
                  <span>₹{settings.freeDeliveryThresholdRupees} Target</span>
                </div>
                <div className="w-full bg-[#FAF8FA] border border-[#E8E2E7] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#18794E] h-full w-[65%]" />
                </div>
                <p className="text-[10px] text-[#6D6670]">
                  Standard charge: ₹{settings.standardShippingFeeRupees} | COD: {settings.codAvailable ? `Available (+₹${settings.codFeeRupees})` : 'Disabled'}
                </p>
              </div>

              {/* Top Announcement Strip Preview */}
              <div className="bg-linear-to-r from-[#FF7E9C] via-[#FF8EA3] to-[#FFA7A6] p-2 text-white rounded text-[11px] font-bold text-center">
                <Truck className="w-3.5 h-3.5 inline mr-1" />
                FREE SHIPPING ON ORDERS ABOVE ₹{settings.freeDeliveryThresholdRupees}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Footer & Brand Information */}
      {activeTab === 'footer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#E8E2E7]">
              <CardContent className="p-6 space-y-5">
                <div className="border-b border-[#E8E2E7] pb-3">
                  <h3 className="text-sm font-bold text-[#19161A] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#B83B63]" />
                    Footer Information & Brand Narrative
                  </h3>
                  <p className="text-xs text-[#6D6670]">
                    Updates real-time customer support details, registered office address, and social links.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">Brand Name</label>
                    <Input
                      value={settings.brandName}
                      onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">Support Operating Hours</label>
                    <Input
                      value={settings.supportHours}
                      onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                      placeholder="e.g. Mon – Fri: 10AM – 6PM IST"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">Brand Bio / Story</label>
                  <textarea
                    rows={3}
                    value={settings.brandStory}
                    onChange={(e) => setSettings({ ...settings, brandStory: e.target.value })}
                    className="w-full text-xs rounded-md border border-[#E8E2E7] p-2.5 focus:border-[#B83B63] focus:outline-none"
                    placeholder="Brief description displayed on the footer brand column..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E8E2E7]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp Support Number
                    </label>
                    <Input
                      value={settings.supportWhatsapp}
                      onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })}
                      placeholder="+91 361 455 6830"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#B83B63]" /> Support Email Address
                    </label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      placeholder="support@dimsglow.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#E8E2E7]">
                  <label className="text-xs font-semibold text-[#19161A]">Registered Office Address</label>
                  <Input
                    value={settings.registeredAddress}
                    onChange={(e) => setSettings({ ...settings, registeredAddress: e.target.value })}
                    placeholder="Full physical address shown on invoices and footer corporate disclosures..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">GSTIN Number</label>
                    <Input
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                      placeholder="18AAACD1234F1Z5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#19161A]">PAN Number</label>
                    <Input
                      value={settings.pan}
                      onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                      placeholder="AAACD1234F"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
                  <h4 className="text-xs font-bold text-[#19161A]">Social Media Profiles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">Instagram URL</label>
                      <Input
                        value={settings.socialInstagram}
                        onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                        placeholder="https://instagram.com/dimsglow"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">Facebook URL</label>
                      <Input
                        value={settings.socialFacebook}
                        onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                        placeholder="https://facebook.com/dimsglow"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">YouTube URL</label>
                      <Input
                        value={settings.socialYoutube}
                        onChange={(e) => setSettings({ ...settings, socialYoutube: e.target.value })}
                        placeholder="https://youtube.com/@dimsglow"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">Twitter / X URL</label>
                      <Input
                        value={settings.socialTwitter}
                        onChange={(e) => setSettings({ ...settings, socialTwitter: e.target.value })}
                        placeholder="https://x.com/dimsglow"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
                  <h4 className="text-xs font-bold text-[#19161A]">Newsletter & Copyright</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">Newsletter Heading</label>
                      <Input
                        value={settings.newsletterHeading}
                        onChange={(e) => setSettings({ ...settings, newsletterHeading: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6D6670]">First Order Promo Code</label>
                      <Input
                        value={settings.newsletterDiscountCode}
                        onChange={(e) => setSettings({ ...settings, newsletterDiscountCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. GLOW10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6670]">Newsletter Subtitle</label>
                    <Input
                      value={settings.newsletterSubheading}
                      onChange={(e) => setSettings({ ...settings, newsletterSubheading: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6670]">Footer Copyright Notice</label>
                    <Input
                      value={settings.copyrightNotice}
                      onChange={(e) => setSettings({ ...settings, copyrightNotice: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Preview */}
          <div className="space-y-4">
            <div className="p-5 rounded-[10px] bg-[#141215] text-[#D1CBD3] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Footer Live View
              </h4>

              <div className="space-y-2 border-b border-white/10 pb-3">
                <span className="text-base font-bold font-serif-brand text-white">{settings.brandName || 'DIMSGLOW'}</span>
                <p className="text-[11px] text-[#9A939E] line-clamp-3 leading-relaxed">
                  {settings.brandStory || 'Brand story preview...'}
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-white font-semibold">Contact & Support:</p>
                <p className="text-[11px] flex items-center gap-1.5 text-[#25D366]">
                  <Phone className="w-3 h-3" /> {settings.supportWhatsapp || settings.supportPhone}
                </p>
                <p className="text-[11px] flex items-center gap-1.5 text-white/90">
                  <Mail className="w-3 h-3 text-[#B83B63]" /> {settings.supportEmail}
                </p>
                <p className="text-[10px] text-[#9A939E] flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {settings.supportHours}
                </p>
                {settings.registeredAddress && (
                  <p className="text-[10px] text-[#8C8590] pt-1">
                    📍 {settings.registeredAddress}
                  </p>
                )}
                {settings.gstin && (
                  <p className="text-[10px] text-[#D4AF37]">
                    GSTIN: {settings.gstin}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] text-[#6D6670]">
                {settings.copyrightNotice}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Announcements & Offer Strip */}
      {activeTab === 'announcements' && (
        <div className="max-w-3xl space-y-6">
          <Card className="border-[#E8E2E7]">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E2E7] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#19161A] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B83B63]" />
                    Rotating Announcement Strip
                  </h3>
                  <p className="text-xs text-[#6D6670]">
                    Top bar rotating banner shown across all storefront pages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#19161A]">Banner Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings.announcementEnabled}
                    onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
                    className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#19161A]">Announcement Messages</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAnnouncement}
                    className="text-xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Message
                  </Button>
                </div>

                {(settings.announcements || []).map((msg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6D6670] w-5 text-right">{idx + 1}.</span>
                    <Input
                      value={msg}
                      onChange={(e) => updateAnnouncement(idx, e.target.value)}
                      placeholder="e.g. FREE SHIPPING ON ORDERS ABOVE ₹399"
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnnouncement(idx)}
                      disabled={(settings.announcements || []).length <= 1}
                      className="text-[#B42318] hover:bg-[#FDF2F2] h-9 w-9 p-0 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Tax, GST & Invoicing */}
      {activeTab === 'tax' && (
        <div className="max-w-3xl space-y-6">
          <Card className="border-[#E8E2E7]">
            <CardContent className="p-6 space-y-5">
              <div className="border-b border-[#E8E2E7] pb-3">
                <h3 className="text-sm font-bold text-[#19161A] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B83B63]" />
                  Tax Invoice & Legal Compliance
                </h3>
                <p className="text-xs text-[#6D6670]">
                  Controls PDF tax invoice generation, HSN categorization, and legal return policy cutoffs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">Legal Entity Name</label>
                  <Input
                    value={settings.legalEntityName}
                    onChange={(e) => setSettings({ ...settings, legalEntityName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">State & State Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      placeholder="Assam"
                    />
                    <Input
                      value={settings.stateCode}
                      onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                      placeholder="18"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#E8E2E7]">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">Default HSN Code</label>
                  <Input
                    value={settings.defaultHsnCode}
                    onChange={(e) => setSettings({ ...settings, defaultHsnCode: e.target.value })}
                    placeholder="33041000"
                  />
                  <p className="text-[10px] text-[#6D6670]">Beauty & Makeup Preparations</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">GST Rate (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="28"
                    value={settings.taxRatePercentage}
                    onChange={(e) => setSettings({ ...settings, taxRatePercentage: Number(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-[#6D6670]">18% standard for cosmetics</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#19161A]">Return Cutoff (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.returnCutoffDays}
                    onChange={(e) => setSettings({ ...settings, returnCutoffDays: Number(e.target.value) || 7 })}
                  />
                  <p className="text-[10px] text-[#6D6670]">Hassle-free return window</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-[#E8E2E7]">
                <label className="text-xs font-semibold text-[#19161A]">Invoice Legal Declaration</label>
                <textarea
                  rows={2}
                  value={settings.invoiceFooterDeclaration}
                  onChange={(e) => setSettings({ ...settings, invoiceFooterDeclaration: e.target.value })}
                  className="w-full text-xs rounded-md border border-[#E8E2E7] p-2.5 focus:border-[#B83B63] focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
