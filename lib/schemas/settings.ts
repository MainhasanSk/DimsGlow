import { z } from 'zod';

export const SiteStoreSettingsSchema = z.object({
  // 1. Shipping & Delivery
  freeDeliveryThresholdRupees: z.number().min(0).default(399),
  standardShippingFeeRupees: z.number().min(0).default(49),
  codAvailable: z.boolean().default(true),
  codFeeRupees: z.number().min(0).default(0),
  expressDeliveryAvailable: z.boolean().default(true),
  expressDeliveryFeeRupees: z.number().min(0).default(99),
  deliveryOfferBanner: z.string().default('FREE SHIPPING ON ORDERS ABOVE ₹399 • DISPATCH WITHIN 24 HOURS'),

  // 2. Footer & Brand Information
  brandName: z.string().min(1).default('DIMSGLOW'),
  brandStory: z.string().default(
    'DIMSGLOW is a luxury beauty and skincare brand dedicated to safe, empowering, dermatologically-tested formulations tailored for all skin tones.'
  ),
  supportPhone: z.string().default('+91 361 455 6830'),
  supportWhatsapp: z.string().default('+91 361 455 6830'),
  supportEmail: z.string().email().default('support@dimsglow.com'),
  contactPhone: z.string().default('+913614556830'),
  contactEmail: z.string().email().default('support@dimsglow.com'),
  supportHours: z.string().default('Mon – Fri: 10AM – 6PM IST'),
  registeredAddress: z.string().default('DIMSGLOW COSMETICS PVT LTD, G.S. Road, Christian Basti, Guwahati, Assam, India - 781005'),
  gstin: z.string().default('18AAACD1234F1Z5'),
  pan: z.string().default('AAACD1234F'),
  socialInstagram: z.string().default('https://instagram.com'),
  socialFacebook: z.string().default('https://facebook.com'),
  socialYoutube: z.string().default('https://youtube.com'),
  socialTwitter: z.string().default('https://twitter.com'),
  copyrightNotice: z.string().default('Copyright © 2026, DIMSGLOW COSMETICS PRIVATE LIMITED. All rights reserved.'),
  newsletterHeading: z.string().default('Subscribe to our newsletter'),
  newsletterSubheading: z.string().default('Be the first to receive exclusive beauty releases, skincare tips, and private VIP offers.'),
  newsletterDiscountCode: z.string().default('GLOW10'),

  // 3. Announcements & Promo Strips
  announcementEnabled: z.boolean().default(true),
  announcements: z.array(z.string()).default([
    'FREE SHIPPING ON ORDERS ABOVE ₹399',
    'EXTRA 5% OFF ON PREPAID ORDERS',
    'FREE GIFT WITH CODE: GLOW10',
  ]),

  // 4. Invoicing, Legal & Tax Compliance
  legalEntityName: z.string().min(1).default('DIMSGLOW COSMETICS PRIVATE LIMITED'),
  state: z.string().default('Assam'),
  stateCode: z.string().default('18'),
  invoicePrefix: z.string().default('INV'),
  defaultHsnCode: z.string().default('33041000'), // Indian HSN for Beauty & Makeup Preparations
  taxRatePercentage: z.number().int().min(0).max(28).default(18), // 18% GST standard on cosmetics
  returnCutoffDays: z.number().int().positive().default(7),
  invoiceFooterDeclaration: z.string().default(
    'This is a computer generated tax invoice and does not require a physical signature. Goods once sold are covered under DIMSGLOW cancellation & return policy.'
  ),
  updatedAt: z.string().optional(),
});

export type SiteStoreSettings = z.infer<typeof SiteStoreSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteStoreSettings = {
  freeDeliveryThresholdRupees: 399,
  standardShippingFeeRupees: 49,
  codAvailable: true,
  codFeeRupees: 0,
  expressDeliveryAvailable: true,
  expressDeliveryFeeRupees: 99,
  deliveryOfferBanner: 'FREE SHIPPING ON ORDERS ABOVE ₹399 • DISPATCH WITHIN 24 HOURS',

  brandName: 'DIMSGLOW',
  brandStory:
    'DIMSGLOW is a luxury beauty and skincare brand dedicated to safe, empowering, dermatologically-tested formulations tailored for all skin tones.',
  supportPhone: '+91 361 455 6830',
  supportWhatsapp: '+91 361 455 6830',
  supportEmail: 'support@dimsglow.com',
  contactPhone: '+913614556830',
  contactEmail: 'support@dimsglow.com',
  supportHours: 'Mon – Fri: 10AM – 6PM IST',
  registeredAddress: 'DIMSGLOW COSMETICS PVT LTD, G.S. Road, Christian Basti, Guwahati, Assam, India - 781005',
  gstin: '18AAACD1234F1Z5',
  pan: 'AAACD1234F',
  socialInstagram: 'https://instagram.com',
  socialFacebook: 'https://facebook.com',
  socialYoutube: 'https://youtube.com',
  socialTwitter: 'https://twitter.com',
  copyrightNotice: 'Copyright © 2026, DIMSGLOW COSMETICS PRIVATE LIMITED. All rights reserved.',
  newsletterHeading: 'Subscribe to our newsletter',
  newsletterSubheading: 'Be the first to receive exclusive beauty releases, skincare tips, and private VIP offers.',
  newsletterDiscountCode: 'GLOW10',

  announcementEnabled: true,
  announcements: [
    'FREE SHIPPING ON ORDERS ABOVE ₹399',
    'EXTRA 5% OFF ON PREPAID ORDERS',
    'FREE GIFT WITH CODE: GLOW10',
  ],

  legalEntityName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
  state: 'Assam',
  stateCode: '18',
  invoicePrefix: 'INV',
  defaultHsnCode: '33041000',
  taxRatePercentage: 18,
  returnCutoffDays: 7,
  invoiceFooterDeclaration:
    'This is a computer generated tax invoice and does not require a physical signature. Goods once sold are covered under DIMSGLOW cancellation & return policy.',
};

// Backward compatibility alias for invoice generator
export const StoreInvoiceSettingsSchema = SiteStoreSettingsSchema;
export type StoreInvoiceSettings = SiteStoreSettings;
export const DEFAULT_STORE_SETTINGS = DEFAULT_SITE_SETTINGS;
