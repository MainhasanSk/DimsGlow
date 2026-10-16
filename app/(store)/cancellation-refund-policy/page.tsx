import React from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { RefreshCcw, ShieldAlert, FileText } from 'lucide-react';

export default function CancellationRefundPolicyPage() {
  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Cancellation & Refund Policy</h1>
          <p className="text-xs text-[#6D6670]">Official DIMSGLOW Guidelines on Order Modifications, Returns, and Refunds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <FileText className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Pre-Shipment Cancellation</h3>
            <p className="text-xs text-[#6D6670]">Free direct cancellation via your dashboard anytime prior to carrier dispatch.</p>
          </div>
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <RefreshCcw className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">7-Day Replacement</h3>
            <p className="text-xs text-[#6D6670]">Applicable if you receive a damaged, defective, or incorrect product.</p>
          </div>
          <div className="p-5 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <ShieldAlert className="w-6 h-6 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Hygiene Standards</h3>
            <p className="text-xs text-[#6D6670]">For customer safety, opened or used cosmetics cannot be returned.</p>
          </div>
        </div>

        <div className="prose prose-sm text-xs leading-relaxed text-[#19161A] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">1. How to Cancel Your Order</h2>
            <p>
              You may cancel your order free of charge at any time before it enters the <strong>Shipped</strong> state. To cancel:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-[#6D6670]">
              <li>Log in to your DIMSGLOW account and navigate to <strong>My Orders</strong>.</li>
              <li>Select the order you wish to cancel and click <strong>Cancel Order</strong>.</li>
              <li>Provide the cancellation reason for our quality control team.</li>
            </ol>
            <p className="text-[#6D6670]">
              Upon successful cancellation, reserved stock is immediately released, the order invoice is voided, and your refund will be processed within 5 to 7 business days to your original payment source.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">2. Post-Dispatch & Return Requests</h2>
            <p>
              Once an order has been dispatched with a tracking number, it cannot be directly cancelled. If your package arrives damaged or defective:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#6D6670]">
              <li>Contact customer care within 48 hours of delivery at <strong>support@dimsglow.com</strong> or WhatsApp <strong>+91 361 455 6830</strong>.</li>
              <li>Share clear photographs of the outer packaging and defective item.</li>
              <li>Our team will arrange a free reverse pickup and issue an immediate replacement or store credit.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#19161A]">3. Invoices and Accounting Treatment</h2>
            <p>
              In compliance with GST statutory accounting rules, cancelled or refunded orders have their tax invoices marked as <strong>Voided</strong> in our canonical records. Voided invoices cannot be downloaded by customers, but remain immutably archived in our system for accounting audit trails.
            </p>
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
