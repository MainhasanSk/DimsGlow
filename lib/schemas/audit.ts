import { z } from 'zod';

export const AuditEventSchema = z.object({
  id: z.string(),
  actorUid: z.string(),
  actorRole: z.string(),
  action: z.string().min(1), // e.g. "order.status_transition", "staff.role_assigned", "product.price_updated"
  targetType: z.string().min(1), // e.g. "order", "product", "userAccess", "invoice"
  targetId: z.string().min(1),
  correlationId: z.string(),
  beforeSummary: z.record(z.any()).optional(),
  afterSummary: z.record(z.any()).optional(),
  reason: z.string().optional(),
  timestamp: z.number(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
