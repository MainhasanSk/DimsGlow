'use client';

import { CATALOG_PRODUCTS, CATEGORIES } from '@/lib/data/catalog';
import type { Product, ProductVariant } from '@/lib/schemas/product';

const STORAGE_KEY_PRODUCTS = 'dimsglow_custom_products';
const STORAGE_KEY_DELETED = 'dimsglow_deleted_products';
const STORAGE_KEY_STOCK = 'dimsglow_stock_overrides';

export interface StockOverride {
  sku: string;
  onHand: number;
  reserved?: number;
  updatedAt: number;
}

/**
 * Retrieves custom products created or updated by admin.
 */
export function getCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse custom products:', err);
    return [];
  }
}

/**
 * Retrieves deleted product IDs.
 */
export function getDeletedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse deleted products:', err);
    return [];
  }
}

/**
 * Retrieves stock overrides.
 */
export function getStockOverrides(): Record<string, StockOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to parse stock overrides:', err);
    return {};
  }
}

/**
 * Returns merged active catalog products (base + custom, minus deleted, with stock applied).
 */
export function getAllProducts(): Product[] {
  const customProducts = getCustomProducts();
  const deletedIds = new Set(getDeletedProductIds());
  const stockOverrides = getStockOverrides();

  // Merge base catalog with custom products (custom takes precedence by id or slug)
  const productMap = new Map<string, Product>();

  // Add default base catalog
  for (const p of CATALOG_PRODUCTS) {
    if (!deletedIds.has(p.id)) {
      productMap.set(p.id, { ...p });
    }
  }

  // Overlay custom / edited products
  for (const cp of customProducts) {
    if (!deletedIds.has(cp.id)) {
      productMap.set(cp.id, { ...cp });
    }
  }

  // Apply stock overrides across variants
  const result: Product[] = [];
  for (const p of productMap.values()) {
    const updatedVariants = p.variants.map((v) => {
      const override = stockOverrides[v.sku];
      if (override !== undefined) {
        return {
          ...v,
          onHand: override.onHand,
          reserved: override.reserved !== undefined ? override.reserved : v.reserved,
        };
      }
      return v;
    });

    result.push({
      ...p,
      variants: updatedVariants,
    });
  }

  return result;
}

/**
 * Retrieves product by slug from merged catalog.
 */
export function getProductBySlugSync(slug: string): Product | null {
  const all = getAllProducts();
  return all.find((p) => p.slug === slug) || null;
}

/**
 * Retrieves products by category slug from merged catalog.
 */
export function getProductsByCategorySync(categorySlug: string): Product[] {
  const all = getAllProducts();
  if (categorySlug === 'all') return all;
  return all.filter((p) => p.categoryIds && p.categoryIds.includes(categorySlug));
}

/**
 * Adds or updates a product in persistent storage.
 */
export function saveProduct(product: Product): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomProducts();
  const existingIdx = custom.findIndex((p) => p.id === product.id || p.slug === product.slug);

  const updatedProduct = {
    ...product,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    custom[existingIdx] = updatedProduct;
  } else {
    custom.push(updatedProduct);
  }

  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(custom));

  // If was previously marked deleted, un-delete
  const deleted = getDeletedProductIds().filter((id) => id !== product.id);
  localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deleted));

  // Notify listeners
  notifyCatalogUpdated();
}

/**
 * Deletes a product by ID.
 */
export function deleteProduct(productId: string): void {
  if (typeof window === 'undefined') return;
  // Remove from custom products
  const custom = getCustomProducts().filter((p) => p.id !== productId);
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(custom));

  // Add to deleted set
  const deleted = getDeletedProductIds();
  if (!deleted.includes(productId)) {
    deleted.push(productId);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deleted));
  }

  notifyCatalogUpdated();
}

/**
 * Updates stock on-hand for a SKU.
 */
export function updateStock(sku: string, newOnHand: number, reservedDelta: number = 0): void {
  if (typeof window === 'undefined') return;
  const overrides = getStockOverrides();
  const current = overrides[sku] || { onHand: newOnHand, reserved: 0 };

  overrides[sku] = {
    sku,
    onHand: Math.max(0, newOnHand),
    reserved: Math.max(0, (current.reserved || 0) + reservedDelta),
    updatedAt: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(overrides));
  notifyCatalogUpdated();
}

/**
 * Batch updates stock overrides.
 */
export function batchUpdateStock(updates: { sku: string; onHand: number }[]): void {
  if (typeof window === 'undefined') return;
  const overrides = getStockOverrides();
  for (const { sku, onHand } of updates) {
    overrides[sku] = {
      sku,
      onHand: Math.max(0, onHand),
      reserved: overrides[sku]?.reserved || 0,
      updatedAt: Date.now(),
    };
  }
  localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(overrides));
  notifyCatalogUpdated();
}

function notifyCatalogUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dimsglow_catalog_updated'));
  }
}
