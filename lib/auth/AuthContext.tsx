'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeAccess) {
        unsubscribeAccess();
        unsubscribeAccess = null;
      }

      if (firebaseUser) {
        const accessDocRef = doc(db, 'userAccess', firebaseUser.uid);

        unsubscribeAccess = onSnapshot(
          accessDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserAccessRecord;
              if (data.status === 'active') {
                setRole(data.role);
                setPermissions(data.permissions || ROLE_DEFAULT_PERMISSIONS[data.role as keyof typeof ROLE_DEFAULT_PERMISSIONS] || []);
              } else {
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
            console.warn('userAccess listener warning:', err.message);
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

    // Safety timeout: Ensure isLoading resolves within 1200ms even if network or auth is slow
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribeAuth();
      if (unsubscribeAccess) unsubscribeAccess();
    };
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setRole('customer');
    setPermissions([]);
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
