/**
 * First-Owner Secure Bootstrap Script
 *
 * Usage:
 *   npx tsx scripts/bootstrap-owner.ts <owner-email>
 *
 * This script assigns the 'owner' role and full management permissions to the designated
 * Firebase Auth user in the canonical Firestore `userAccess/{uid}` document.
 */

import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ROLE_DEFAULT_PERMISSIONS } from '../lib/auth/roles';

async function bootstrapOwner() {
  const email = process.argv[2];
  if (!email) {
    console.error('Error: Please provide the owner email address: npx tsx scripts/bootstrap-owner.ts <email>');
    process.exit(1);
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dimsglowweb';

  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const hasAppCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!hasServiceAccount && !hasAppCreds) {
    console.error('Error: Firebase Admin credentials not found.');
    console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local or GOOGLE_APPLICATION_CREDENTIALS.');
    console.error('Note: Superuser accounts (such as test@gmail.com and admin accounts) are automatically elevated via AuthContext.');
    process.exit(1);
  }

  if (!getApps().length) {
    if (hasServiceAccount) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      initializeApp({
        credential: cert(sa),
        projectId,
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    }
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    const user = await auth.getUserByEmail(email.trim().toLowerCase());
    console.log(`Found Firebase user: ${user.email} (UID: ${user.uid})`);

    const now = Date.now();
    await db.collection('userAccess').doc(user.uid).set({
      uid: user.uid,
      role: 'owner',
      permissions: ROLE_DEFAULT_PERMISSIONS.owner,
      status: 'active',
      createdBy: 'system_bootstrap',
      createdAt: now,
      updatedAt: now,
    });

    await auth.setCustomUserClaims(user.uid, {
      role: 'owner',
    });

    console.log(`Successfully bootstrapped ${user.email} as DIMSGLOW Store Owner.`);
    process.exit(0);
  } catch (error: any) {
    console.error('Bootstrap failed:', error.message);
    process.exit(1);
  }
}

bootstrapOwner();
