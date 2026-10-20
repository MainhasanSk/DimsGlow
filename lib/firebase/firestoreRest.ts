/**
 * Server-side Firestore REST Client
 * Provides resilient, direct read/write access to Cloud Firestore
 * without requiring gRPC native bindings or external service account files.
 * Used as fallback when Firebase Admin SDK service account is not available.
 */

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAHP6NXbXJbYq6kwMUzROjepw4zH2I0Qzc';
const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dimsglowweb';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || 'dimsglow_admin@dimsglow.com';
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || 'DimsglowAdmin2026!';

let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Authenticate with Firebase Auth REST API to obtain an admin ID token
 */
export async function getAdminIdToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        returnSecureToken: true,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Failed to obtain Firebase admin ID token:', await res.text());
      return null;
    }

    const data = await res.json();
    cachedToken = data.idToken;
    const expiresInSec = Number(data.expiresIn || 3600);
    tokenExpiry = now + expiresInSec * 1000;
    return cachedToken;
  } catch (err) {
    console.warn('Error authenticating admin ID token:', err);
    return null;
  }
}

/**
 * Convert standard JS value to Firestore REST typed format
 */
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Convert Firestore REST typed format back to standard JS value
 */
export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

/**
 * Save document to Cloud Firestore
 */
export async function saveFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const token = await getAdminIdToken();
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = toFirestoreValue(v);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fsUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firestore save failed for ${collection}/${docId}:`, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Error saving Firestore doc ${collection}/${docId}:`, err);
    return false;
  }
}

/**
 * Get document from Cloud Firestore
 */
export async function getFirestoreDoc<T = any>(
  collection: string,
  docId: string
): Promise<T | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return null;
    }

    const doc = await res.json();
    if (!doc.fields) return null;

    const restored: Record<string, any> = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      restored[k] = fromFirestoreValue(v);
    }
    return restored as T;
  } catch (err) {
    console.warn(`Error getting Firestore doc ${collection}/${docId}:`, err);
    return null;
  }
}

/**
 * List all documents in a Firestore collection (up to pageSize)
 */
export async function listCollection<T = any>(
  collection: string,
  pageSize = 100
): Promise<Array<T & { _id: string }>> {
  try {
    const token = await getAdminIdToken();
    const url = `${FS_BASE}/${collection}?pageSize=${pageSize}${token ? '' : `&key=${FIREBASE_API_KEY}`}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      const restored: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        restored[k] = fromFirestoreValue(v);
      }
      const nameParts = (doc.name as string).split('/');
      restored._id = nameParts[nameParts.length - 1];
      return restored as T & { _id: string };
    });
  } catch (err) {
    console.warn(`Error listing Firestore collection ${collection}:`, err);
    return [];
  }
}

/**
 * Delete a document from Cloud Firestore
 */
export async function deleteFirestoreDoc(collection: string, docId: string): Promise<boolean> {
  try {
    const token = await getAdminIdToken();
    const url = `${FS_BASE}/${collection}/${docId}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'DELETE', headers, cache: 'no-store' });
    return res.ok;
  } catch (err) {
    console.warn(`Error deleting Firestore doc ${collection}/${docId}:`, err);
    return false;
  }
}

/**
 * Add a new document with auto-generated ID
 */
export async function addFirestoreDoc(
  collection: string,
  data: Record<string, any>
): Promise<string | null> {
  const newId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ok = await saveFirestoreDoc(collection, newId, { ...data, id: newId });
  return ok ? newId : null;
}

/**
 * Run a structured query (basic WHERE + orderBy + limit)
 */
export async function queryCollection<T = any>(
  collection: string,
  filters: Array<{ field: string; op: 'EQUAL' | 'NOT_EQUAL' | 'LESS_THAN' | 'GREATER_THAN' | 'IN' | 'ARRAY_CONTAINS'; value: any }> = [],
  orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' },
  limitN = 50
): Promise<Array<T & { _id: string }>> {
  try {
    const token = await getAdminIdToken();
    const structuredQuery: any = {
      from: [{ collectionId: collection }],
      limit: limitN,
    };
    if (filters.length === 1) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: filters[0].field },
          op: filters[0].op,
          value: toFirestoreValue(filters[0].value),
        },
      };
    } else if (filters.length > 1) {
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: filters.map((f) => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: toFirestoreValue(f.value),
            },
          })),
        },
      };
    }
    if (orderBy) {
      structuredQuery.orderBy = [
        { field: { fieldPath: orderBy.field }, direction: orderBy.direction || 'DESCENDING' },
      ];
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${FS_BASE}:runQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ structuredQuery }),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return rows
      .filter((r: any) => r.document)
      .map((r: any) => {
        const fields = r.document.fields || {};
        const data: Record<string, any> = {};
        for (const [k, v] of Object.entries(fields)) {
          data[k] = fromFirestoreValue(v);
        }
        const nameParts = (r.document.name as string).split('/');
        data._id = nameParts[nameParts.length - 1];
        return data as T & { _id: string };
      });
  } catch (err) {
    console.warn(`Error querying Firestore collection ${collection}:`, err);
    return [];
  }
}
