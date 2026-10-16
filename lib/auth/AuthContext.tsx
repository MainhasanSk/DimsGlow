'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserRole, Permission, UserAccessRecord } from './roles';

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'customer',
  permissions: [],
  isLoading: true,
  signOut: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeAccess: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeAccess) {
        unsubscribeAccess();
        unsubscribeAccess = null;
      }

      if (firebaseUser) {
        // Subscribe to userAccess/{uid} to detect role/permission grants or revocation
        const accessDocRef = doc(db, 'userAccess', firebaseUser.uid);
        unsubscribeAccess = onSnapshot(
          accessDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserAccessRecord;
              if (data.status === 'active') {
                setRole(data.role);
                setPermissions(data.permissions || []);
              } else {
                // If account is disabled/suspended, treat as restricted
                setRole('customer');
                setPermissions([]);
              }
            } else {
              setRole('customer');
              setPermissions([]);
            }
            setIsLoading(false);
          },
          (err) => {
            // Default-deny rules or missing document
            setRole('customer');
            setPermissions([]);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
