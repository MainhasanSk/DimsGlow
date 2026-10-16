import React from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';

export default function PrivacyPolicyPage() {
  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Privacy Policy</h1>
          <p className="text-xs text-[#6D6670]">Effective Date: October 2026 | DIMSGLOW Customer Data Protection</p>
        </div>

        <div className="prose prose-sm text-xs leading-relaxed text-[#19161A] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">1. Data Minimization Principles</h2>
            <p className="text-[#6D6670]">
              In accordance with security and privacy requirements in our architecture, DIMSGLOW only collects data strictly necessary for order processing, logistics delivery, and customer care. We never sell, lease, or rent customer personal information to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-[#6D6670]">
              <li>Contact Details: Name, email address, phone number, and delivery address.</li>
              <li>Authentication Data: Managed securely by Firebase Authentication. Passwords are never stored on our servers.</li>
              <li>Order History: Saved securely in Google Cloud Firestore under your authenticated user ID.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">3. Data Security and Deletion Rights</h2>
            <p className="text-[#6D6670]">
              All communication is encrypted via TLS/HTTPS. You can request account deactivation or address deletion by contacting our privacy compliance team at <strong>support@dimsglow.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
