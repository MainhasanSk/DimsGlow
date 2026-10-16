'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

export interface CartLineItem {
  id: string; // `${productId}_${variantId || 'default'}`
  productId: string;
  variantId?: string;
  productName: string;
  variantTitle?: string;
  quantity: number;
  unitPricePaise: number;
  compareAtPricePaise?: number;
  imageUrl?: string;
  slug: string;
  addedAt: number;
}

interface CartContextType {
  items: CartLineItem[];
  totalItemCount: number;
  subtotalPaise: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartLineItem, 'addedAt'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  favorites: string[]; // List of favorited product IDs
  favoritesCount: number;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Subscribe to Firestore or fallback to session state
  useEffect(() => {
    if (!user) {
      // Guest mode: load session/local storage
      try {
        const savedCart = sessionStorage.getItem('dimsglow_guest_cart');
        const savedFavs = sessionStorage.getItem('dimsglow_guest_favs');
        if (savedCart) setItems(JSON.parse(savedCart));
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
      } catch (err) {
        console.warn('SessionStorage read error:', err);
      }
      setIsLoaded(true);
      return;
    }

    // Authenticated user: real-time Firestore synchronization
    // Path: carts/{uid}/items/{itemId}
    const cartCollRef = collection(db, 'carts', user.uid, 'items');
    const unsubCart = onSnapshot(
      cartCollRef,
      (snapshot) => {
        const firestoreItems: CartLineItem[] = [];
        snapshot.forEach((docSnap) => {
          firestoreItems.push(docSnap.data() as CartLineItem);
        });
        firestoreItems.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        setItems(firestoreItems);
        setIsLoaded(true);
      },
      (err) => {
        console.error('Firestore cart subscription error:', err);
        setIsLoaded(true);
      }
    );

    // Path: favorites/{uid}/items/{productId}
    const favCollRef = collection(db, 'favorites', user.uid, 'items');
    const unsubFav = onSnapshot(
      favCollRef,
      (snapshot) => {
        const favIds: string[] = [];
        snapshot.forEach((docSnap) => {
          favIds.push(docSnap.id);
        });
        setFavorites(favIds);
      },
      (err) => {
        console.error('Firestore favorites subscription error:', err);
      }
    );

    // Sync guest items if any existed before sign-in
    try {
      const guestCart = sessionStorage.getItem('dimsglow_guest_cart');
      if (guestCart) {
        const parsedGuestItems: CartLineItem[] = JSON.parse(guestCart);
        if (parsedGuestItems.length > 0) {
          const batch = writeBatch(db);
          parsedGuestItems.forEach((item) => {
            const itemRef = doc(db, 'carts', user.uid, 'items', item.id);
            batch.set(itemRef, item, { merge: true });
          });
          batch.commit().catch(console.error);
          sessionStorage.removeItem('dimsglow_guest_cart');
        }
      }
      const guestFavs = sessionStorage.getItem('dimsglow_guest_favs');
      if (guestFavs) {
        const parsedGuestFavs: string[] = JSON.parse(guestFavs);
        if (parsedGuestFavs.length > 0) {
          const batch = writeBatch(db);
          parsedGuestFavs.forEach((pid) => {
            const favRef = doc(db, 'favorites', user.uid, 'items', pid);
            batch.set(favRef, { productId: pid, addedAt: Date.now() });
          });
          batch.commit().catch(console.error);
          sessionStorage.removeItem('dimsglow_guest_favs');
        }
      }
    } catch (err) {
      console.warn('Error merging guest cart on auth:', err);
    }

    return () => {
      unsubCart();
      unsubFav();
    };
  }, [user]);

  // Save guest state changes to sessionStorage
  const persistGuestCart = (newItems: CartLineItem[]) => {
    try {
      sessionStorage.setItem('dimsglow_guest_cart', JSON.stringify(newItems));
    } catch (err) {
      console.warn('SessionStorage write error:', err);
    }
  };

  const persistGuestFavs = (newFavs: string[]) => {
    try {
      sessionStorage.setItem('dimsglow_guest_favs', JSON.stringify(newFavs));
    } catch (err) {
      console.warn('SessionStorage write error:', err);
    }
  };

  // 2. Add to Cart
  const addToCart = useCallback(
    async (itemData: Omit<CartLineItem, 'addedAt'>) => {
      const newItem: CartLineItem = {
        ...itemData,
        addedAt: Date.now(),
      };

      if (user) {
        const existing = items.find((i) => i.id === newItem.id);
        const finalQuantity = existing ? existing.quantity + newItem.quantity : newItem.quantity;
        const itemRef = doc(db, 'carts', user.uid, 'items', newItem.id);
        await setDoc(itemRef, {
          ...newItem,
          quantity: Math.min(finalQuantity, 10), // Limit per order
          addedAt: existing ? existing.addedAt : newItem.addedAt,
        });
      } else {
        setItems((prev) => {
          const existingIndex = prev.findIndex((i) => i.id === newItem.id);
          let updated: CartLineItem[];
          if (existingIndex > -1) {
            updated = [...prev];
            const current = updated[existingIndex];
            updated[existingIndex] = {
              ...current,
              quantity: Math.min(current.quantity + newItem.quantity, 10),
            };
          } else {
            updated = [newItem, ...prev];
          }
          persistGuestCart(updated);
          return updated;
        });
      }

      setIsCartDrawerOpen(true);
    },
    [user, items]
  );

  // 3. Update Quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const clampedQty = Math.min(quantity, 10);

      if (user) {
        const itemRef = doc(db, 'carts', user.uid, 'items', itemId);
        await setDoc(itemRef, { quantity: clampedQty }, { merge: true });
      } else {
        setItems((prev) => {
          const updated = prev.map((item) =>
            item.id === itemId ? { ...item, quantity: clampedQty } : item
          );
          persistGuestCart(updated);
          return updated;
        });
      }
    },
    [user]
  );

  // 4. Remove Item
  const removeItem = useCallback(
    async (itemId: string) => {
      if (user) {
        const itemRef = doc(db, 'carts', user.uid, 'items', itemId);
        await deleteDoc(itemRef);
      } else {
        setItems((prev) => {
          const updated = prev.filter((item) => item.id !== itemId);
          persistGuestCart(updated);
          return updated;
        });
      }
    },
    [user]
  );

  // 5. Clear Cart
  const clearCart = useCallback(async () => {
    if (user) {
      const cartCollRef = collection(db, 'carts', user.uid, 'items');
      const snap = await getDocs(cartCollRef);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } else {
      setItems([]);
      sessionStorage.removeItem('dimsglow_guest_cart');
    }
  }, [user]);

  // 6. Favorites
  const toggleFavorite = useCallback(
    async (productId: string) => {
      const exists = favorites.includes(productId);

      if (user) {
        const favRef = doc(db, 'favorites', user.uid, 'items', productId);
        if (exists) {
          await deleteDoc(favRef);
        } else {
          await setDoc(favRef, { productId, addedAt: Date.now() });
        }
      } else {
        setFavorites((prev) => {
          const updated = exists
            ? prev.filter((id) => id !== productId)
            : [...prev, productId];
          persistGuestFavs(updated);
          return updated;
        });
      }
    },
    [user, favorites]
  );

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  // Calculations
  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalPaise = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemCount,
        subtotalPaise,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        favorites,
        favoritesCount: favorites.length,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
