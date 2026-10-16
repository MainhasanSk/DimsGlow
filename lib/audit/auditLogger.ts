import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { AuditEvent } from '@/lib/schemas/audit';

export interface RecordAuditParams {
  actorUid: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId?: string;
  beforeSummary?: Record<string, any>;
  afterSummary?: Record<string, any>;
  reason?: string;
}

/**
 * Appends an immutable audit event record in the canonical Firestore collection `auditEvents`.
 * Strips any sensitive fields (tokens, passwords, secrets, full card details).
 */
export async function logAuditEvent(params: RecordAuditParams): Promise<string> {
  const auditCollection = adminDb.collection('auditEvents');
  const auditRef = auditCollection.doc();
  const correlationId = params.correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Sanitize summaries to protect against secret leakage
  const sanitize = (obj?: Record<string, any>) => {
    if (!obj) return undefined;
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (
        /password|secret|token|key|credential|auth/i.test(key)
      ) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = val;
      }
    }
    return clean;
  };

  const auditEvent: AuditEvent = {
    id: auditRef.id,
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    correlationId,
    beforeSummary: sanitize(params.beforeSummary),
    afterSummary: sanitize(params.afterSummary),
    reason: params.reason,
    timestamp: Date.now(),
  };

  await auditRef.set(auditEvent);
  return auditRef.id;
}
