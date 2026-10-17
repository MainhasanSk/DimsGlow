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

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
        databaseURL,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
        databaseURL,
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Resilient proxy so server endpoints don't crash with "collection is not a function"
const createSafeDbProxy = (): admin.firestore.Firestore => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'collection') {
        return (collName: string) => ({
          doc: (docId?: string) => ({
            id: docId || `doc_${Date.now()}`,
            get: async () => ({ exists: false, data: () => null, id: docId }),
            set: async () => {},
            update: async () => {},
            delete: async () => {},
            collection: (subColl: string) => ({
              get: async () => ({ empty: true, docs: [], forEach: () => {} }),
              add: async () => ({ id: `sub_${Date.now()}` }),
            }),
          }),
          where: () => ({
            limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
            orderBy: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
            get: async () => ({ empty: true, docs: [], forEach: () => {} }),
          }),
          orderBy: () => ({
            limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
            where: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
            get: async () => ({ empty: true, docs: [], forEach: () => {} }),
          }),
          limit: () => ({
            get: async () => ({ empty: true, docs: [], forEach: () => {} }),
          }),
          get: async () => ({ empty: true, docs: [], forEach: () => {} }),
          add: async () => ({ id: `doc_${Date.now()}` }),
        });
      }
      if (prop === 'runTransaction') {
        return async (callback: any) => {
          return await callback({
            get: async () => ({ exists: false, data: () => null }),
            set: async () => {},
            update: async () => {},
            delete: async () => {},
          });
        };
      }
      if (prop === 'batch') {
        return () => ({
          set: () => {},
          update: () => {},
          delete: () => {},
          commit: async () => {},
        });
      }
      return undefined;
    },
  };
  return new Proxy({}, handler);
};

export const adminAuth = admin.apps.length ? admin.auth() : ({} as admin.auth.Auth);
export const adminDb = admin.apps.length ? admin.firestore() : createSafeDbProxy();

export const getAdminRtdb = () => {
  try {
    if (admin.apps.length) {
      return admin.database();
    }
    return null;
  } catch {
    return null;
  }
};

export default admin;
