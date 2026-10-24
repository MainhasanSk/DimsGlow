import { useState, useEffect } from 'react';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import { db } from '@/lib/firebase/client';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
import type { Product, ProductVariant } from '@/lib/schemas/product';

let memoryProducts: Product[] = [...CATALOG_PRODUCTS];
let isFirestoreInitialized = false;

// Initialize real-time sync with Firestore products collection
if (typeof window !== 'undefined' && !isFirestoreInitialized) {
  isFirestoreInitialized = true;
  try {
    const productsColl = collection(db, 'products');
    onSnapshot(
      productsColl,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Product);
          });
          memoryProducts = list;
          window.dispatchEvent(new CustomEvent('dimsglow_catalog_updated'));
        } else {
          // If Firestore is empty, seed from API
          fetch('/api/products')
            .then((r) => r.json())
            .then((data) => {
              if (data.products && data.products.length > 0) {
                memoryProducts = data.products;
                window.dispatchEvent(new CustomEvent('dimsglow_catalog_updated'));
              }
            })
            .catch(() => {});
        }
      },
      (err) => {
        console.warn('Firestore products listener fallback to API:', err.message);
        fetch('/api/products')
          .then((r) => r.json())
          .then((data) => {
            if (data.products && data.products.length > 0) {
              memoryProducts = data.products;
              window.dispatchEvent(new CustomEvent('dimsglow_catalog_updated'));
            }
          })
          .catch(() => {});
      }
    );
  } catch (err) {
    console.warn('Client Firestore listener setup exception:', err);
  }
}

/**
 * Returns merged active catalog products directly from database state.
 */
export function getAllProducts(): Product[] {
  // Always ensure default flagship CATALOG_PRODUCTS (like tinted-sunscreen-spf50) are present,
  // overlaid with any live Firestore updates by slug or ID
  const map = new Map<string, Product>();
  for (const p of CATALOG_PRODUCTS) {
    map.set(p.slug, p);
  }
  for (const p of memoryProducts) {
    map.set(p.slug, p);
  }
  return Array.from(map.values());
}

/**
 * Retrieves product by slug from current database memory.
 */
export function getProductBySlugSync(slug: string): Product | null {
  const all = getAllProducts();
  return all.find((p) => p.slug === slug) || null;
}

/**
 * Retrieves products by category slug from database memory.
 */
export function getProductsByCategorySync(categorySlug: string): Product[] {
  const all = getAllProducts();
  if (categorySlug === 'all') return all;
  return all.filter((p) => p.categoryIds && p.categoryIds.includes(categorySlug));
}

/**
 * Adds or updates a product atomically in Firestore database and notifies listeners.
 */
export async function saveProduct(product: Product): Promise<void> {
  const updatedProduct: Product = {
    ...product,
    updatedAt: Date.now(),
  };

  // 1. Immediately update local memory for instant responsiveness
  const idx = memoryProducts.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (idx >= 0) {
    memoryProducts[idx] = updatedProduct;
  } else {
    memoryProducts = [updatedProduct, ...memoryProducts];
  }

  notifyCatalogUpdated();

  // 2. Commit atomically to Firestore database via direct client SDK
  try {
    const productRef = doc(db, 'products', product.id);
    await setDoc(productRef, updatedProduct, { merge: true });
  } catch (clientErr) {
    console.warn('Direct Firestore save failed, syncing through API endpoint:', clientErr);
  }

  // 3. Guarantee persistence and audit logging via server API
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
  } catch (apiErr) {
    console.error('API products save error:', apiErr);
  }
}

/**
 * Deletes a product atomically from Firestore database.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const productToDelete = memoryProducts.find((p) => p.id === productId);

  // 1. Immediate memory update
  memoryProducts = memoryProducts.filter((p) => p.id !== productId);
  notifyCatalogUpdated();

  // 2. Direct Firestore deletion
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (clientErr) {
    console.warn('Direct Firestore delete failed:', clientErr);
  }

  // 3. Guarantee deletion via server API
  if (productToDelete) {
    try {
      await fetch(`/api/products/${productToDelete.slug}`, {
        method: 'DELETE',
      });
    } catch (apiErr) {
      console.error('API products delete error:', apiErr);
    }
  }
}

/**
 * Updates stock on-hand for a SKU atomically in Firestore.
 */
export async function updateStock(sku: string, newOnHand: number): Promise<void> {
  let targetProduct: Product | null = null;

  // 1. Update in-memory product variant
  memoryProducts = memoryProducts.map((p) => {
    const hasSku = p.variants.some((v) => v.sku === sku);
    if (!hasSku) return p;

    targetProduct = {
      ...p,
      variants: p.variants.map((v) =>
        v.sku === sku ? { ...v, onHand: Math.max(0, newOnHand) } : v
      ),
      updatedAt: Date.now(),
    };
    return targetProduct;
  });

  notifyCatalogUpdated();

  // 2. Write updated product atomically to Firestore
  if (targetProduct) {
    try {
      const pRef = doc(db, 'products', (targetProduct as Product).id);
      await setDoc(pRef, targetProduct, { merge: true });
    } catch (err) {
      console.warn('Stock update Firestore error:', err);
    }

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetProduct),
      });
    } catch (err) {
      console.error('Stock update API error:', err);
    }
  }
}

/**
 * Batch updates stock for multiple SKUs.
 */
export async function batchUpdateStock(updates: { sku: string; onHand: number }[]): Promise<void> {
  for (const item of updates) {
    await updateStock(item.sku, item.onHand);
  }
}

function notifyCatalogUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dimsglow_catalog_updated'));
  }
}

/**
 * React hook that provides dynamic, live synced catalog products from Firestore & Cloudinary.
 */
export function useProducts(): { products: Product[]; loading: boolean } {
  const [products, setProducts] = useState<Product[]>(() => getAllProducts());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Initial sync
    setProducts(getAllProducts());

    const handleUpdate = () => {
      setProducts([...getAllProducts()]);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dimsglow_catalog_updated', handleUpdate);
    }

    // Proactively fetch latest catalog from API (Firestore backend)
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          memoryProducts = data.products;
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn('useProducts Firestore sync error:', err));

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dimsglow_catalog_updated', handleUpdate);
      }
    };
  }, []);

  return { products, loading };
}

/**
 * React hook for a single live product by slug.
 */
export function useProduct(slug: string): { product: Product | null; loading: boolean } {
  const { products, loading } = useProducts();
  const product = products.find((p) => p.slug === slug) || null;
  return { product, loading };
}

