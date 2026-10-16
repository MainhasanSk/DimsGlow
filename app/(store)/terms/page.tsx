import React from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';

export default function TermsPage() {
  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Terms & Conditions</h1>
          <p className="text-xs text-[#6D6670]">Last updated: October 2026 | DIMSGLOW E-Commerce Terms of Service</p>
        </div>

        <div className="prose prose-sm text-xs leading-relaxed text-[#19161A] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">1. Agreement to Terms</h2>
            <p className="text-[#6D6670]">
              By accessing and purchasing from DIMSGLOW (website, dashboard, or authorized ordering services), you agree to be bound by these Terms and Conditions and our associated operational policies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">2. Product Availability and Pricing</h2>
            <p className="text-[#6D6670]">
              All product prices are quoted in Indian Rupees (INR) inclusive of applicable GST taxes. We reserve the right to modify prices, update catalog availability, or cancel orders arising from typographical or technical errors prior to carrier shipment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">3. Account Security and Authorization</h2>
            <p className="text-[#6D6670]">
              Customers are responsible for maintaining the confidentiality of their account credentials. Privileged actions, order placements, and invoice downloads are authenticated via Firebase Authentication.
            </p>
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
