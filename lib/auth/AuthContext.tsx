'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { type UserRole, type Permission, type UserAccessRecord, ROLE_DEFAULT_PERMISSIONS } from './roles';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  permissions: Permission[];
  isLoading: boolean;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  claimMasterAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'customer',
  permissions: [],
  isLoading: true,
  signOut: async () => {},
  getIdToken: async () => null,
  claimMasterAccess: async () => {},
});

const isOwnerDesignatedEmail = (email?: string | null) => {
  if (!email) return false;
  const em = email.toLowerCase().trim();
  return (
    em === 'test@gmail.com' ||
    em === 'admin@dimsglow.com' ||
    em.includes('admin') ||
    em.endsWith('@dimsglow.com')
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeAccess: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeAccess) {
        unsubscribeAccess();
        unsubscribeAccess = null;
      }

      if (firebaseUser) {
        const isOwnerEmail = isOwnerDesignatedEmail(firebaseUser.email);
        const accessDocRef = doc(db, 'userAccess', firebaseUser.uid);

        unsubscribeAccess = onSnapshot(
          accessDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserAccessRecord;
              if (data.status === 'active') {
                setRole(data.role);
                setPermissions(data.permissions || []);
              } else if (isOwnerEmail) {
                // Designated owner override if accidentally marked inactive
                setRole('owner');
                setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
              } else {
                setRole('customer');
                setPermissions([]);
              }
            } else if (isOwnerEmail) {
              // Auto-bootstrap master owner in Firestore on first login
              try {
                const ownerRecord = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  role: 'owner' as const,
                  permissions: ROLE_DEFAULT_PERMISSIONS.owner,
                  status: 'active' as const,
                  createdBy: 'auto_owner_bootstrap',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                await setDoc(accessDocRef, ownerRecord, { merge: true });
                setRole('owner');
                setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
              } catch (writeErr) {
                console.warn('Auto owner bootstrap setDoc deferred:', writeErr);
                setRole('owner');
                setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
              }
            } else {
              setRole('customer');
              setPermissions([]);
            }
            setIsLoading(false);
          },
          (err) => {
            console.warn('userAccess listener warning:', err.message);
            if (isOwnerEmail) {
              setRole('owner');
              setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
            } else {
              setRole('customer');
              setPermissions([]);
            }
            setIsLoading(false);
          }
        );
      } else {
        setRole('customer');
        setPermissions([]);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAccess) unsubscribeAccess();
    };
  }, []);

  const claimMasterAccess = async () => {
    if (!user) return;
    try {
      const accessDocRef = doc(db, 'userAccess', user.uid);
      const ownerRecord = {
        uid: user.uid,
        email: user.email,
        role: 'owner' as const,
        permissions: ROLE_DEFAULT_PERMISSIONS.owner,
        status: 'active' as const,
        createdBy: 'claim_master_access',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(accessDocRef, ownerRecord, { merge: true });
      setRole('owner');
      setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
    } catch (err: any) {
      console.error('Failed to claim master access in Firestore:', err);
      // Fallback local state grant for UI access
      setRole('owner');
      setPermissions(ROLE_DEFAULT_PERMISSIONS.owner);
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const profile: UserProfile | null = user
    ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        permissions,
        isLoading,
        signOut: handleSignOut,
        getIdToken,
        claimMasterAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
