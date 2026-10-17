import React from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactPage() {
  return (
    <StorefrontShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Contact Customer Care</h1>
          <p className="text-xs text-[#6D6670]">
            We're here to assist you with order inquiries, product recommendations, and beauty advice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-serif-brand text-[#19161A]">Get in Touch</h2>
            <p className="text-xs text-[#6D6670] leading-relaxed">
              Have a question regarding your order, shades, ingredients, or partnerships? Reach out directly via phone, WhatsApp, or email.
            </p>

            <div className="space-y-4 pt-2">
              <a
                href="https://wa.me/913614556830"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3.5 p-4 rounded-lg bg-[#F7F5F7] hover:bg-[#FBEAF0] border border-[#E8E2E7] transition-colors"
              >
                <div className="p-2 rounded-full bg-[#25D366] text-white">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#19161A]">WhatsApp Official Hotline</h4>
                  <p className="text-xs text-[#B83B63] font-semibold">+91 361 455 6830</p>
                  <p className="text-[10px] text-[#6D6670]">Instant support during business hours</p>
                </div>
              </a>

              <div className="flex items-start gap-3.5 p-4 rounded-lg bg-[#F7F5F7] border border-[#E8E2E7]">
                <div className="p-2 rounded-full bg-[#B83B63] text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#19161A]">Customer Support Email</h4>
                  <p className="text-xs text-[#19161A] font-semibold">support@dimsglow.com</p>
                  <p className="text-[10px] text-[#6D6670]">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-lg bg-[#F7F5F7] border border-[#E8E2E7]">
                <div className="p-2 rounded-full bg-[#19161A] text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#19161A]">Operating Hours</h4>
                  <p className="text-xs text-[#19161A]">Monday – Friday: 10:00 AM – 6:00 PM IST</p>
                  <p className="text-[10px] text-[#6D6670]">Closed on National Holidays</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E8E2E7] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#19161A]">Send Us a Message</h3>
            <form className="space-y-3.5">
              <Input label="Your Name" placeholder="e.g. Meera Sen" required />
              <Input label="Email Address" type="email" placeholder="meera@example.com" required />
              <Input label="Order Number (Optional)" placeholder="e.g. DIMS-2026-1001" />
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#19161A] tracking-wide">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can our beauty specialists help you today?"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border border-[#E8E2E7] bg-white text-[#19161A] placeholder:text-[#9A939E] focus:outline-none focus:border-[#B83B63] focus:ring-1 focus:ring-[#B83B63]"
                />
              </div>
              <Button type="button" variant="primary" size="lg" className="w-full">
                Submit Inquiry
              </Button>
            </form>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
