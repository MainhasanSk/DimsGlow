import React from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Shipping & Delivery Policy</h1>
          <p className="text-xs text-[#6D6670]">Effective Date: October 2026 | DIMSGLOW Official Fulfillment Guidelines</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Truck className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Free Shipping</h3>
            <p className="text-xs text-[#6D6670]">On all prepaid orders and orders exceeding ₹399 across India.</p>
          </div>
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Clock className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Dispatch Timeline</h3>
            <p className="text-xs text-[#6D6670]">Orders are packed and dispatched within 24 to 48 business hours.</p>
          </div>
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <ShieldCheck className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Tamper-Proof Packing</h3>
            <p className="text-xs text-[#6D6670]">Specially cushioned protective packaging ensuring zero transit leakage.</p>
          </div>
        </div>

        <div className="prose prose-sm text-xs leading-relaxed text-[#19161A] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">1. Serviceable Locations</h2>
            <p>
              DIMSGLOW currently ships to over 27,000 postal PIN codes across India through our verified domestic courier partners (including Bluedart, Delhivery, DTDC, and India Post).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">2. Estimated Delivery Timelines</h2>
            <ul className="list-disc pl-5 space-y-1 text-[#6D6670]">
              <li>Metro cities (Delhi NCR, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad): 2 to 4 business days.</li>
              <li>Rest of India & Tier 2/3 locations: 4 to 7 business days.</li>
              <li>North-East, J&K, and remote regions: 5 to 9 business days.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">3. Live Shipment Tracking</h2>
            <p>
              Once your order has been packed and handed over to our courier partners, your live tracking details will immediately reflect in your DIMSGLOW Customer Dashboard under Order Tracking. You will also receive SMS and WhatsApp tracking updates.
            </p>
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
