'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/data/catalog';
import {
  getAllProducts,
  saveProduct,
  deleteProduct,
} from '@/lib/catalog/productStore';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Layers,
  Sparkles,
  X,
  Save,
  Image as ImageIcon,
  Star,
  Gift,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

import { uploadToCloudinary } from '@/lib/cloudinary/clientUpload';

interface VariantDraft {
  id: string;
  sku: string;
  title: string;
  swatchColor: string;
  priceRupees: string;
  onHand: string;
}

interface MediaDraft {
  publicId: string;
  secureUrl: string;
  altText: string;
  isPrimary: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [notification, setNotification] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBenefitPill, setFormBenefitPill] = useState('Natural Glow, Dewy Finish');
  const [formPrice, setFormPrice] = useState('319');
  const [formComparePrice, setFormComparePrice] = useState('399');
  const [formCategories, setFormCategories] = useState<string[]>(['face']);
  const [formStatus, setFormStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [formUnlockGift, setFormUnlockGift] = useState(true);
  const [formFeatured, setFormFeatured] = useState(true);
  const [formBestseller, setFormBestseller] = useState(false);

  // Multi-Image Gallery State
  const [mediaList, setMediaList] = useState<MediaDraft[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Variants & Shades State
  const [variantsList, setVariantsList] = useState<VariantDraft[]>([]);

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Load products from productStore
  const refreshProducts = () => {
    const list = getAllProducts();
    setProducts(list);
  };

  useEffect(() => {
    refreshProducts();

    const handleUpdate = () => {
      refreshProducts();
    };

    window.addEventListener('dimsglow_catalog_updated', handleUpdate);
    return () => window.removeEventListener('dimsglow_catalog_updated', handleUpdate);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || p.categoryIds.includes(selectedCategory);

      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  // Metrics
  const totalProducts = products.length;
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const totalVariants = products.reduce((acc, p) => acc + p.variants.length, 0);

  // Handle Multi-file Upload from Device to Cloudinary
  const handleDeviceFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadToCloudinary(file, 'dimsglow/products');
        const newMedia: MediaDraft = {
          publicId: res.publicId,
          secureUrl: res.secureUrl,
          altText: formName ? `${formName} view ${mediaList.length + i + 1}` : file.name,
          isPrimary: mediaList.length === 0 && i === 0,
        };
        setMediaList((prev) => [...prev, newMedia]);
      }
    } catch (err) {
      console.error('Cloudinary media upload error:', err);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Add Image by URL
  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const newMedia: MediaDraft = {
      publicId: `url_${Date.now()}`,
      secureUrl: customImageUrl.trim(),
      altText: formName || 'Product Image',
      isPrimary: mediaList.length === 0,
    };
    setMediaList((prev) => [...prev, newMedia]);
    setCustomImageUrl('');
  };

  // Remove Image from Gallery
  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((m) => m.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Set Primary Image
  const handleSetPrimaryMedia = (index: number) => {
    setMediaList((prev) =>
      prev.map((m, i) => ({
        ...m,
        isPrimary: i === index,
      }))
    );
  };

  // Open Modal for "Add New Product"
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormName('');
    setFormSlug('');
    setFormTagline('');
    setFormDescription('');
    setFormBenefitPill('Natural Glow, Dewy Finish');
    setFormPrice('319');
    setFormComparePrice('399');
    setFormCategories(['face']);
    setFormStatus('published');
    setFormUnlockGift(true);
    setFormFeatured(true);
    setFormBestseller(false);
    setMediaList([
      {
        publicId: 'default_1',
        secureUrl: '/products/featured-product.jpeg',
        altText: 'Primary Product Image',
        isPrimary: true,
      },
    ]);
    setVariantsList([
      {
        id: `var_${Date.now()}_1`,
        sku: 'DIMS-NEW-01',
        title: 'Natural Glow',
        swatchColor: '#F5E3D3',
        priceRupees: '319',
        onHand: '50',
      },
    ]);
    setIsModalOpen(true);
  };

  // Open Modal for "Edit Product"
  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormTagline(p.tagline || '');
    setFormDescription(p.description || '');
    setFormBenefitPill(p.benefitPill || 'Natural Glow, Dewy Finish');
    setFormPrice((p.pricePaise / 100).toString());
    setFormComparePrice(p.compareAtPricePaise ? (p.compareAtPricePaise / 100).toString() : '');
    setFormCategories(p.categoryIds || ['face']);
    setFormStatus(p.status || 'published');
    setFormUnlockGift(!!p.unlockFreeGift);
    setFormFeatured(!!p.featured);
    setFormBestseller(!!p.bestseller);

    // Media
    const mappedMedia: MediaDraft[] = (p.media || []).map((m) => ({
      publicId: m.publicId,
      secureUrl: m.secureUrl,
      altText: m.altText || p.name,
      isPrimary: !!m.isPrimary,
    }));
    if (mappedMedia.length === 0) {
      mappedMedia.push({
        publicId: 'default_1',
        secureUrl: '/products/featured-product.jpeg',
        altText: p.name,
        isPrimary: true,
      });
    }
    setMediaList(mappedMedia);

    // Variants
    const mappedVariants: VariantDraft[] = p.variants.map((v) => {
      const swatch = v.options?.find((o) => o.swatchColor)?.swatchColor || '#F5E3D3';
      return {
        id: v.id,
        sku: v.sku,
        title: v.title,
        swatchColor: swatch,
        priceRupees: ((v.pricePaise || p.pricePaise) / 100).toString(),
        onHand: (v.onHand || 0).toString(),
      };
    });
    setVariantsList(mappedVariants);

    setIsModalOpen(true);
  };

  // Add Shade Variant in Modal
  const handleAddVariantDraft = () => {
    const idx = variantsList.length + 1;
    setVariantsList((prev) => [
      ...prev,
      {
        id: `var_${Date.now()}_${idx}`,
        sku: `DIMS-${formSlug ? formSlug.toUpperCase().slice(0, 6) : 'PROD'}-0${idx}`,
        title: `Shade 0${idx}`,
        swatchColor: '#E8D0BA',
        priceRupees: formPrice || '319',
        onHand: '40',
      },
    ]);
  };

  // Remove Shade Variant
  const handleRemoveVariantDraft = (index: number) => {
    if (variantsList.length <= 1) return;
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Shade Variant Field
  const handleUpdateVariantField = (
    index: number,
    field: keyof VariantDraft,
    val: string
  ) => {
    setVariantsList((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    );
  };

  // Toggle Category Checkbox
  const toggleCategorySelection = (catId: string) => {
    setFormCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug =
      formSlug.trim() ||
      formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const pricePaise = Math.round(parseFloat(formPrice || '0') * 100);
    const compareAtPaise = formComparePrice
      ? Math.round(parseFloat(formComparePrice) * 100)
      : undefined;

    // Build variants
    const constructedVariants: ProductVariant[] = variantsList.map((vd) => ({
      id: vd.id,
      sku: vd.sku.trim() || `SKU-${Date.now()}`,
      title: vd.title.trim() || 'Default Shade',
      options: [
        {
          name: 'Shade',
          value: vd.title.trim() || 'Default Shade',
          swatchColor: vd.swatchColor,
        },
      ],
      pricePaise: Math.round(parseFloat(vd.priceRupees || formPrice) * 100),
      onHand: parseInt(vd.onHand || '0', 10),
      reserved: 0,
      lowStockThreshold: 5,
      active: true,
    }));

    // Ensure at least one primary media
    const finalMedia = mediaList.map((m, idx) => ({
      publicId: m.publicId || `media_${Date.now()}_${idx}`,
      secureUrl: m.secureUrl,
      altText: m.altText || formName,
      isPrimary: m.isPrimary || idx === 0,
    }));

    const productPayload: Product = {
      id: editingProductId || `prod_${Date.now()}`,
      slug,
      name: formName.trim(),
      tagline: formTagline.trim() || undefined,
      description: formDescription.trim() || 'Premium DIMSGLOW cosmetic formulation designed for all-day radiance.',
      categoryIds: formCategories,
      status: formStatus,
      pricePaise,
      compareAtPricePaise: compareAtPaise,
      currency: 'INR',
      media: finalMedia,
      benefitPill: formBenefitPill.trim() || undefined,
      unlockFreeGift: formUnlockGift,
      featured: formFeatured,
      bestseller: formBestseller,
      ratingSummary: { average: 5.0, reviewCount: 12 },
      trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
      variants: constructedVariants,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProduct(productPayload);
    setIsModalOpen(false);
    showNotice(
      editingProductId
        ? `Successfully updated "${productPayload.name}"`
        : `Successfully created and published "${productPayload.name}"`
    );
  };

  // Confirm Delete
  const handleExecuteDelete = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    showNotice(`Deleted product "${productToDelete.name}" from catalog`);
    setProductToDelete(null);
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2E7]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#19161A] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#B83B63]" /> Products Management & Multi-Image Catalog
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Create, update, and manage products, category assignments, multi-image galleries, and shade swatch inventories.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenAddModal}
          className="text-xs font-bold bg-[#B83B63] hover:bg-[#9B2C4F] flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-[#E6F4EA] border border-[#A7F3D0] text-[#18794E] rounded-lg text-xs font-semibold flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#6D6670] uppercase">Total Products</span>
          <p className="text-2xl font-black text-[#19161A]">{totalProducts}</p>
          <span className="text-[10px] text-[#6D6670]">Active in system catalog</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#6D6670] uppercase">Published</span>
          <p className="text-2xl font-black text-[#18794E]">{publishedCount}</p>
          <span className="text-[10px] text-[#18794E] font-medium">Visible on Storefront</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#6D6670] uppercase">Total Shade SKUs</span>
          <p className="text-2xl font-black text-[#B83B63]">{totalVariants}</p>
          <span className="text-[10px] text-[#B83B63] font-medium">Swatches & Options</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#6D6670] uppercase">Categories Covered</span>
          <p className="text-2xl font-black text-[#D4AF37]">{Object.keys(CATEGORIES).length}</p>
          <span className="text-[10px] text-[#D4AF37] font-medium">Full store coverage</span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C8490] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search products by title, slug, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#B83B63] text-white shadow-xs'
                : 'bg-[#FAF8FA] text-[#6D6670] hover:text-[#19161A] hover:bg-[#F2EFF2]'
            }`}
          >
            All Categories ({totalProducts})
          </button>
          {Object.entries(CATEGORIES).map(([catKey, cat]) => {
            const count = products.filter((p) => p.categoryIds.includes(catKey)).length;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === catKey
                    ? 'bg-[#B83B63] text-white shadow-xs'
                    : 'bg-[#FAF8FA] text-[#6D6670] hover:text-[#19161A] hover:bg-[#F2EFF2]'
                }`}
              >
                {cat.title} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FA] border-b border-[#E8E2E7] text-[#6D6670] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Product & Gallery</th>
                <th className="py-3 px-4">Categories</th>
                <th className="py-3 px-4">Price & MSRP</th>
                <th className="py-3 px-4 text-center">Shades</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2E7]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#6D6670]">
                    <Package className="w-10 h-10 text-[#8C8490] mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-[#19161A]">No products found</p>
                    <p className="text-xs text-[#6D6670] mt-1">Try another search term or click "+ Add New Product".</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg =
                    p.media?.find((m) => m.isPrimary)?.secureUrl ||
                    p.media?.[0]?.secureUrl ||
                    '/products/featured-product.jpeg';
                  const totalOnHand = p.variants.reduce((s, v) => s + (v.onHand || 0), 0);
                  const imagesCount = p.media?.length || 1;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8FA]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg border border-[#E8E2E7] overflow-hidden shrink-0 bg-[#FAF8FA] group">
                            <Image
                              src={primaryImg}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                            {imagesCount > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[8px] font-extrabold px-1 py-0.5 rounded-tl">
                                {imagesCount}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-[#19161A] line-clamp-1">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-[#6D6670] line-clamp-1">
                              {p.tagline || `Slug: /${p.slug}`}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {p.bestseller && (
                                <span className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                                  Bestseller
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.categoryIds.map((cid) => (
                            <span
                              key={cid}
                              className="bg-[#FAF8FA] border border-[#E8E2E7] text-[#6D6670] px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              {cid}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#19161A] block">
                          {formatPricePaise(p.pricePaise)}
                        </span>
                        {p.compareAtPricePaise && p.compareAtPricePaise > p.pricePaise && (
                          <span className="text-[10px] text-[#8C8490] line-through block">
                            {formatPricePaise(p.compareAtPricePaise)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-[#19161A]">
                          {p.variants.length} shades
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-black ${
                            totalOnHand <= 0
                              ? 'text-rose-600'
                              : totalOnHand <= 10
                              ? 'text-[#D4AF37]'
                              : 'text-[#18794E]'
                          }`}
                        >
                          {totalOnHand}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'published'
                              ? 'bg-[#E6F4EA] text-[#18794E] border border-[#A7F3D0]'
                              : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md hover:bg-[#F2EFF2] text-[#6D6670] hover:text-[#19161A]"
                            title="View on Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-md hover:bg-[#FBEAF0] text-[#6D6670] hover:text-[#B83B63] cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-md hover:bg-[#FEF2F2] text-[#6D6670] hover:text-[#DC2626] cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProductId ? `Edit Product — ${formName}` : 'Add New Product to Catalog'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveProduct} className="space-y-6 pt-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" /> 1. Core Product Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#19161A] mb-1">
                    Product Title *
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingProductId) {
                        setFormSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    placeholder="e.g. Skin Tint 5 In 1 Serum Foundation"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19161A] mb-1">
                    URL Slug *
                  </label>
                  <Input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. skin-tint-5-in-1"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19161A] mb-1">
                  Tagline / Short Hook
                </label>
                <Input
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g. Lightweight formula with Niacinamide & Rice Water for natural glow"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19161A] mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed formula description, benefits, wear test, and directions..."
                  className="w-full text-xs p-3 rounded-lg border border-[#E8E2E7] bg-white focus:outline-none focus:border-[#B83B63]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#19161A] mb-1">
                    Base Price (₹) *
                  </label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="319"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19161A] mb-1">
                    Compare-at MSRP (₹)
                  </label>
                  <Input
                    type="number"
                    value={formComparePrice}
                    onChange={(e) => setFormComparePrice(e.target.value)}
                    placeholder="399"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19161A] mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs bg-white border border-[#E8E2E7] rounded-md px-3 py-2"
                  >
                    <option value="published">Published (Visible in Store)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Assignment */}
            <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
              <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4" /> 2. Category Assignment
              </h4>
              <p className="text-[11px] text-[#6D6670]">
                Select all store collections where this product should appear.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                  const isChecked = formCategories.includes(catKey);
                  return (
                    <label
                      key={catKey}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#B83B63] bg-[#FBEAF0] font-bold text-[#B83B63]'
                          : 'border-[#E8E2E7] bg-white text-[#6D6670] hover:bg-[#FAF8FA]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategorySelection(catKey)}
                        className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                      />
                      <span>{cat.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Multi-Image Gallery Management */}
            <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> 3. Multi-Image Gallery ({mediaList.length} Images)
                </h4>
                <label className="text-xs font-bold text-[#B83B63] bg-[#FBEAF0] hover:bg-[#B83B63] hover:text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-1.5">
                  <Upload className={`w-3.5 h-3.5 ${uploadingMedia ? 'animate-spin' : ''}`} />
                  <span>{uploadingMedia ? 'Uploading to Cloudinary...' : 'Upload from Device (Cloudinary)'}</span>
                  <input
                    type="file"
                    multiple
                    disabled={uploadingMedia}
                    accept="image/*"
                    onChange={handleDeviceFilesUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste an image URL (e.g. /categories/face.jpg or CDN link)..."
                  className="text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImageUrl}
                  className="text-xs shrink-0"
                >
                  + Add URL
                </Button>
              </div>

              {/* Uploaded Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mediaList.map((med, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-lg border-2 overflow-hidden bg-[#FAF8FA] group p-1 ${
                      med.isPrimary
                        ? 'border-[#B83B63] shadow-xs'
                        : 'border-[#E8E2E7]'
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded overflow-hidden">
                      <Image
                        src={med.secureUrl}
                        alt={`Preview ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {med.isPrimary ? (
                      <span className="absolute top-2 left-2 bg-[#B83B63] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryMedia(idx)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-[#B83B63] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-[#FEF2F2] text-[#DC2626] rounded-full shadow-sm cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shade Variants & Stock */}
            <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4" /> 4. Shades, Swatches & Stock Variations ({variantsList.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariantDraft}
                  className="text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Shade
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {variantsList.map((vd, idx) => (
                  <div
                    key={vd.id}
                    className="p-3 bg-[#FAF8FA] rounded-lg border border-[#E8E2E7] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <input
                        type="color"
                        value={vd.swatchColor}
                        onChange={(e) => handleUpdateVariantField(idx, 'swatchColor', e.target.value)}
                        className="w-7 h-7 rounded border border-[#E8E2E7] cursor-pointer shrink-0 p-0"
                        title="Pick shade hex swatch"
                      />
                      <Input
                        value={vd.title}
                        onChange={(e) => handleUpdateVariantField(idx, 'title', e.target.value)}
                        placeholder="Shade Name"
                        className="text-xs h-8"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        value={vd.sku}
                        onChange={(e) => handleUpdateVariantField(idx, 'sku', e.target.value)}
                        placeholder="SKU Code"
                        className="text-xs h-8 font-mono"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        value={vd.priceRupees}
                        onChange={(e) => handleUpdateVariantField(idx, 'priceRupees', e.target.value)}
                        placeholder="Price ₹"
                        className="text-xs h-8"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        value={vd.onHand}
                        onChange={(e) => handleUpdateVariantField(idx, 'onHand', e.target.value)}
                        placeholder="Stock"
                        className="text-xs h-8"
                        required
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      {variantsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantDraft(idx)}
                          className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded cursor-pointer"
                          title="Remove shade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges & Flags */}
            <div className="space-y-3 pt-3 border-t border-[#E8E2E7]">
              <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4" /> 5. Storefront Badges & Highlights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-[#19161A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formUnlockGift}
                    onChange={(e) => setFormUnlockGift(e.target.checked)}
                    className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                  />
                  <span>Unlock Free Gift Badge</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#19161A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBestseller}
                    onChange={(e) => setFormBestseller(e.target.checked)}
                    className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                  />
                  <span>Mark as Bestseller</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#19161A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2E7]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-[#B83B63] hover:bg-[#9B2C4F] flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {editingProductId ? 'Save Product Changes' : 'Publish Product to Store'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          title="Confirm Product Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#6D6670] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#19161A] font-bold">"{productToDelete.name}"</strong>{' '}
              from the active catalog? This will remove it from all categories and storefront search.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2E7]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleExecuteDelete}
                className="text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C]"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
