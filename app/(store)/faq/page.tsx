'use client';

import React, { useState } from 'react';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Are your products cruelty-free and 100% vegan?',
    answer:
      'Yes, absolutely. DIMSGLOW is 100% committed to ethical beauty. None of our finished products or raw ingredients are ever tested on animals, and all our formulations are PETA certified cruelty-free and vegan.',
  },
  {
    question: 'Are your products free from parabens, sulfates, and other harmful chemicals?',
    answer:
      'Yes. All DIMSGLOW cosmetics and skincare essentials are strictly formulated without parabens, sulfates, phthalates, mineral oils, formaldehyde, or heavy metals. We adhere to Bureau Veritas safety and toxic-free standards.',
  },
  {
    question: 'Are your products suited for all types of skin?',
    answer:
      'Our formulations are dermatologically tested and suitable for oily, combination, dry, and sensitive skin types. We formulate non-comedogenic bases infused with skin-loving ingredients like Niacinamide, Rice Water, and Hyaluronic Acid.',
  },
  {
    question: 'Do your products have a fragrance?',
    answer:
      'Our facial cosmetics and skincare ranges are either completely fragrance-free or utilize hypoallergenic, ultra-low scent concentrations to avoid irritation on delicate skin.',
  },
  {
    question: 'What ingredients we don\'t use?',
    answer:
      'We never formulate with talc, parabens, sulfates (SLS/SLES), synthetic micro-beads, formaldehyde-releasing preservatives, or animal-derived ingredients.',
  },
  {
    question: 'What are the safety standards the company stands for?',
    answer:
      'Every single batch is manufactured in certified GMP facilities following ISO 22716 guidelines, subjected to clinical dermatological safety testing, and inspected for microbiological purity before leaving our warehouse.',
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className="border border-[#E8E2E7] rounded-lg bg-white overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-xs sm:text-sm text-[#19161A] hover:text-[#B83B63] transition-colors cursor-pointer select-none"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={cn('w-4 h-4 text-[#6D6670] transition-transform duration-200 shrink-0 ml-2', {
                  'rotate-180 text-[#B83B63]': isOpen,
                })}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-5 pt-0 sm:px-5 text-xs text-[#6D6670] leading-relaxed border-t border-[#F7F5F7] animate-in fade-in duration-150">
                <p className="pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FAQPage() {
  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-8">
          <HelpCircle className="w-8 h-8 mx-auto text-[#B83B63]" />
          <h1 className="text-3xl font-bold font-serif-brand text-[#19161A]">Frequently Asked Questions</h1>
          <p className="text-xs text-[#6D6670]">
            Everything you need to know about DIMSGLOW formulas, safety certifications, and orders.
          </p>
        </div>

        <FAQAccordion />
      </div>
    </StorefrontShell>
  );
}
