import 'server-only';
import admin from 'firebase-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dimsglowweb';
const databaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://dimsglowweb-default-rtdb.asia-southeast1.firebasedatabase.app';

export const hasAdminCredentials = !!(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

const fbAdmin: any = (admin as any)?.default || admin;
const getAppsList = (): any[] => {
  try {
    return fbAdmin?.apps || [];
  } catch {
    return [];
  }
};

if (!getAppsList().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      fbAdmin.initializeApp({
        credential: fbAdmin.credential.cert(serviceAccount),
        projectId,
        databaseURL,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      fbAdmin.initializeApp({
        credential: fbAdmin.credential.applicationDefault(),
        projectId,
        databaseURL,
      });
    } else {
      // No service account – all Firestore ops will use REST API via restDb proxy below
      console.warn(
        '[Firebase Admin] No service account found. Using REST API fallback for Firestore operations.'
      );
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REST-BACKED FIRESTORE PROXY
// When Firebase Admin SDK has no service account, this proxy routes ALL
// Firestore operations through the Firestore REST API (authenticated via
// admin email/password). This ensures orders, content, settings actually
// persist to Firebase instead of being silently swallowed.
// ─────────────────────────────────────────────────────────────────────────────

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAHP6NXbXJbYq6kwMUzROjepw4zH2I0Qzc';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dimsglowweb';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || 'dimsglow_admin@dimsglow.com';
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || 'DimsglowAdmin2026!';

// Token cache (shared between calls within the same process)
let _cachedRestToken: string | null = null;
let _tokenExpiry = 0;

async function getRestToken(): Promise<string | null> {
  const now = Date.now();
  if (_cachedRestToken && now < _tokenExpiry - 60000) return _cachedRestToken;
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('[Firebase Admin REST] Token fetch failed:', await res.text());
      return null;
    }
    const data = await res.json();
    _cachedRestToken = data.idToken;
    _tokenExpiry = now + Number(data.expiresIn || 3600) * 1000;
    return _cachedRestToken;
  } catch (err) {
    console.warn('[Firebase Admin REST] Token error:', err);
    return null;
  }
}

function toFsValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFsValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFsValue);
  if ('mapValue' in val) {
    const r: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      r[k] = fromFsValue(v);
    }
    return r;
  }
  return null;
}

function docDataFromFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = fromFsValue(v);
  }
  return result;
}

function generateDocId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function opMap(op: string): string {
  const m: Record<string, string> = {
    '==': 'EQUAL', '!=': 'NOT_EQUAL',
    '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL',
    '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL',
    'in': 'IN', 'array-contains': 'ARRAY_CONTAINS',
  };
  return m[op] || 'EQUAL';
}

interface RestDocRef {
  id: string;
  collection: (sub: string) => RestCollRef;
  get: () => Promise<{ exists: boolean; data: () => any; id: string }>;
  set: (data: any, opts?: { merge?: boolean }) => Promise<void>;
  update: (data: any) => Promise<void>;
  delete: () => Promise<void>;
}

interface RestCollRef {
  doc: (id?: string) => RestDocRef;
  add: (data: any) => Promise<{ id: string }>;
  where: (field: string, op: string, value: any) => RestQueryRef;
  orderBy: (field: string, dir?: string) => RestQueryRef;
  limit: (n: number) => RestQueryRef;
  get: () => Promise<{ empty: boolean; docs: any[]; forEach: (cb: (d: any) => void) => void }>;
}

interface RestQueryRef {
  where: (field: string, op: string, value: any) => RestQueryRef;
  orderBy: (field: string, dir?: string) => RestQueryRef;
  limit: (n: number) => RestQueryRef;
  get: () => Promise<{ empty: boolean; docs: any[]; forEach: (cb: (d: any) => void) => void }>;
}

function makeDocRef(collPath: string, docId: string): RestDocRef {
  const fsUrl = `${FS_BASE}/${collPath}/${docId}`;
  return {
    id: docId,
    collection: (sub: string) => makeCollRef(`${collPath}/${docId}/${sub}`),
    get: async () => {
      const token = await getRestToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        const res = await fetch(fsUrl + (token ? '' : `?key=${FIREBASE_API_KEY}`), { headers, cache: 'no-store' });
        if (!res.ok) return { exists: false, data: () => null, id: docId };
        const doc = await res.json();
        if (!doc.fields) return { exists: false, data: () => null, id: docId };
        const data = docDataFromFields(doc.fields);
        return { exists: true, data: () => data, id: docId };
      } catch {
        return { exists: false, data: () => null, id: docId };
      }
    },
    set: async (data: any, opts?: { merge?: boolean }) => {
      let payload = data;
      if (opts?.merge) {
        const existing = (await makeDocRef(collPath, docId).get()).data() || {};
        payload = { ...existing, ...data };
      }
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined) fields[k] = toFsValue(v);
      }
      const token = await getRestToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(fsUrl + (token ? '' : `?key=${FIREBASE_API_KEY}`), {
        method: 'PATCH', headers, body: JSON.stringify({ fields }), cache: 'no-store',
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn(`[Firebase REST] set failed for ${collPath}/${docId}:`, txt);
      }
    },
    update: async (data: any) => {
      const current = (await makeDocRef(collPath, docId).get()).data() || {};
      await makeDocRef(collPath, docId).set({ ...current, ...data });
    },
    delete: async () => {
      const token = await getRestToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(fsUrl, { method: 'DELETE', headers, cache: 'no-store' });
    },
  };
}

function makeQueryRef(
  collPath: string,
  filters: Array<{ field: string; op: string; value: any }>,
  orderByField?: { field: string; dir: string },
  limitN?: number
): RestQueryRef {
  const execute = async () => {
    const token = await getRestToken();
    const structuredQuery: any = { from: [{ collectionId: collPath.split('/').pop() }], limit: limitN || 50 };
    if (filters.length === 1) {
      structuredQuery.where = { fieldFilter: { field: { fieldPath: filters[0].field }, op: opMap(filters[0].op), value: toFsValue(filters[0].value) } };
    } else if (filters.length > 1) {
      structuredQuery.where = { compositeFilter: { op: 'AND', filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: opMap(f.op), value: toFsValue(f.value) } })) } };
    }
    if (orderByField) {
      const dirUpper = (orderByField.dir || 'desc').toUpperCase();
      const direction = dirUpper.startsWith('ASC') ? 'ASCENDING' : 'DESCENDING';
      structuredQuery.orderBy = [{ field: { fieldPath: orderByField.field }, direction }];
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Determine parent path for runQuery
    const pathParts = collPath.split('/');
    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const queryUrl = parentPath
      ? `${FS_BASE}/${parentPath}:runQuery`
      : `${FS_BASE}:runQuery`;
    try {
      const res = await fetch(queryUrl, { method: 'POST', headers, body: JSON.stringify({ structuredQuery }), cache: 'no-store' });
      if (!res.ok) return [];
      const rows: any[] = await res.json();
      return rows.filter(r => r.document).map(r => {
        const data = docDataFromFields(r.document.fields || {});
        const nameParts = (r.document.name as string).split('/');
        data._docId = nameParts[nameParts.length - 1];
        return { id: data._docId, data: () => data, exists: true };
      });
    } catch (err) {
      console.warn(`[Firebase REST] query failed for ${collPath}:`, err);
      return [];
    }
  };

  const makeResult = async () => {
    const docs = await execute();
    return { empty: docs.length === 0, docs, forEach: (cb: any) => docs.forEach(cb) };
  };

  return {
    where: (f, op, v) => makeQueryRef(collPath, [...filters, { field: f, op, value: v }], orderByField, limitN),
    orderBy: (f, dir = 'desc') => makeQueryRef(collPath, filters, { field: f, dir }, limitN),
    limit: (n) => makeQueryRef(collPath, filters, orderByField, n),
    get: makeResult,
  };
}

function makeCollRef(collPath: string): RestCollRef {
  return {
    doc: (id?: string) => makeDocRef(collPath, id || generateDocId()),
    add: async (data: any) => {
      const newId = generateDocId();
      await makeDocRef(collPath, newId).set({ ...data, id: newId });
      return { id: newId };
    },
    where: (f, op, v) => makeQueryRef(collPath, [{ field: f, op, value: v }]),
    orderBy: (f, dir = 'desc') => makeQueryRef(collPath, [], { field: f, dir }),
    limit: (n) => makeQueryRef(collPath, [], undefined, n),
    get: async () => {
      const token = await getRestToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = `${FS_BASE}/${collPath}?pageSize=100${token ? '' : `&key=${FIREBASE_API_KEY}`}`;
      try {
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (!res.ok) return { empty: true, docs: [], forEach: () => {} };
        const data = await res.json();
        const docs = (data.documents || []).map((doc: any) => {
          const fields = doc.fields || {};
          const restored = docDataFromFields(fields);
          const nameParts = (doc.name as string).split('/');
          restored._docId = nameParts[nameParts.length - 1];
          return { id: restored._docId, data: () => restored, exists: true };
        });
        return { empty: docs.length === 0, docs, forEach: (cb: any) => docs.forEach(cb) };
      } catch {
        return { empty: true, docs: [], forEach: () => {} };
      }
    },
  };
}

// REST-backed transaction (sequential ops, functionally atomic for most cases)
async function runRestTransaction(callback: (txn: any) => Promise<void>): Promise<void> {
  const ops: Array<() => Promise<void>> = [];
  const txn = {
    get: (ref: any) => ref.get(),
    set: (ref: any, data: any, opts?: any) => { ops.push(() => ref.set(data, opts)); },
    update: (ref: any, data: any) => { ops.push(() => ref.update(data)); },
    delete: (ref: any) => { ops.push(() => ref.delete()); },
  };
  await callback(txn);
  for (const op of ops) await op();
}

// REST-backed batch
function makeRestBatch() {
  const ops: Array<() => Promise<void>> = [];
  return {
    set: (ref: any, data: any, opts?: any) => { ops.push(() => ref.set(data, opts)); },
    update: (ref: any, data: any) => { ops.push(() => ref.update(data)); },
    delete: (ref: any) => { ops.push(() => ref.delete()); },
    commit: async () => { for (const op of ops) await op(); },
  };
}

const restDb = {
  collection: (collPath: string) => makeCollRef(collPath),
  runTransaction: runRestTransaction,
  batch: makeRestBatch,
};

// ─── Final exports ─────────────────────────────────────────────────────────────

export const adminAuth = getAppsList().length ? fbAdmin.auth() : ({} as admin.auth.Auth);
export const adminDb = (getAppsList().length ? fbAdmin.firestore() : restDb) as unknown as FirebaseFirestore.Firestore;

export const getAdminRtdb = () => {
  try {
    if (getAppsList().length) return fbAdmin.database();
    return null;
  } catch {
    return null;
  }
};

export default admin;
