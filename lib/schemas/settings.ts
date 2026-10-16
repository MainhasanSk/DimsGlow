import { z } from 'zod';

export const StoreInvoiceSettingsSchema = z.object({
  legalEntityName: z.string().min(1).default('DIMSGLOW COSMETICS PRIVATE LIMITED'),
  brandName: z.string().min(1).default('DIMSGLOW'),
  registeredAddress: z.string().min(1).default('G.S. Road, Christian Basti, Guwahati, Assam, India - 781005'),
  state: z.string().default('Assam'),
  stateCode: z.string().default('18'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  contactPhone: z.string().default('+913614556830'),
  contactEmail: z.string().email().default('support@dimsglow.com'),
  invoicePrefix: z.string().default('INV'),
  defaultHsnCode: z.string().default('33041000'), // Indian HSN for Beauty & Makeup Preparations
  taxRatePercentage: z.number().int().min(0).max(28).default(18), // 18% GST standard on cosmetics
  returnCutoffDays: z.number().int().positive().default(7),
  invoiceFooterDeclaration: z.string().default(
    'This is a computer generated tax invoice and does not require a physical signature. Goods once sold are covered under DIMSGLOW cancellation & return policy.'
  ),
});

export type StoreInvoiceSettings = z.infer<typeof StoreInvoiceSettingsSchema>;

export const DEFAULT_STORE_SETTINGS: StoreInvoiceSettings = {
  legalEntityName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
  brandName: 'DIMSGLOW',
  registeredAddress: 'G.S. Road, Christian Basti, Guwahati, Assam, India - 781005',
  state: 'Assam',
  stateCode: '18',
  gstin: undefined, // Owner configured in production
  pan: undefined,
  contactPhone: '+913614556830',
  contactEmail: 'support@dimsglow.com',
  invoicePrefix: 'INV',
  defaultHsnCode: '33041000',
  taxRatePercentage: 18,
  returnCutoffDays: 7,
  invoiceFooterDeclaration:
    'This is a computer generated tax invoice and does not require a physical signature. Goods once sold are covered under DIMSGLOW cancellation & return policy.',
};
