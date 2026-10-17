'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  DEFAULT_SITE_SETTINGS,
  SiteStoreSettingsSchema,
  type SiteStoreSettings,
} from '@/lib/schemas/settings';

const SETTINGS_COLLECTION = 'siteSettings';
const SETTINGS_DOC_ID = 'general';

/**
 * Fetches current store settings from Firestore or API
 */
export async function getStoreSettings(): Promise<SiteStoreSettings> {
  try {
    // 1. Try Firestore client SDK
    if (db) {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const parsed = SiteStoreSettingsSchema.safeParse(snap.data());
        if (parsed.success) return parsed.data;
      }
    }

    // 2. Fallback to API route
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const parsed = SiteStoreSettingsSchema.safeParse(data);
      if (parsed.success) return parsed.data;
    }
  } catch (err) {
    console.warn('Using default store settings fallback:', err);
  }
  return DEFAULT_SITE_SETTINGS;
}

/**
 * Saves updated store settings to Firestore via API route (transactional + audit logged)
 */
export async function saveStoreSettings(settings: Partial<SiteStoreSettings>): Promise<SiteStoreSettings> {
  const merged = { ...DEFAULT_SITE_SETTINGS, ...settings, updatedAt: new Date().toISOString() };

  // Call API for ACID transaction & audit log
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save store settings');
  }

  const json = await res.json();
  return json.settings || merged;
}

/**
 * Subscribes to real-time changes of store settings in Firestore.
 */
export function subscribeStoreSettings(
  callback: (settings: SiteStoreSettings) => void
): () => void {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const parsed = SiteStoreSettingsSchema.safeParse(snap.data());
          if (parsed.success) {
            callback(parsed.data);
            return;
          }
        }
        callback(DEFAULT_SITE_SETTINGS);
      },
      (error) => {
        console.warn('Firestore settings subscription error, using default:', error);
        callback(DEFAULT_SITE_SETTINGS);
      }
    );
  } catch (e) {
    console.warn('Could not establish real-time settings listener:', e);
    callback(DEFAULT_SITE_SETTINGS);
    return () => {};
  }
}

/**
 * React hook to consume dynamic store settings with real-time Firestore synchronization.
 */
export function useStoreSettings() {
  const [settings, setSettings] = useState<SiteStoreSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    getStoreSettings().then((data) => {
      setSettings(data);
      setIsLoading(false);
    });

    // Subscribe to real-time Firestore updates
    const unsubscribe = subscribeStoreSettings((updated) => {
      setSettings(updated);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    settings,
    isLoading,
    updateSettings: saveStoreSettings,
  };
}
