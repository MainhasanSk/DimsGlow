'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getHomepageContent,
  saveHomepageContent,
  getCategoryHeroes,
  saveCategoryHeroes,
  seedAllContentToFirestore,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_CATEGORY_HEROES,
} from '@/lib/content/contentService';
import type {
  HomepageContent,
  CategoryHero,
  HeroSlide,
  PromoClinical,
  RoutineLook,
  Testimonial,
  FaqItem,
} from '@/lib/schemas/content';
import {
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Image as ImageIcon,
  Palette,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Upload,
  Video,
  Film,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const GRADIENT_PRESETS = [
  { name: 'Burgundy Luxe', value: 'from-[#2D0B1E] via-[#541235] to-[#141215]' },
  { name: 'Deep Emerald', value: 'from-[#0C2D3E] via-[#104D6B] to-[#0A1A24]' },
  { name: 'Gold Amber', value: 'from-[#3A1C0E] via-[#6B3210] to-[#1A0B05]' },
  { name: 'Rose Glass', value: 'from-[#331422] via-[#5C233E] to-[#1C0913]' },
  { name: 'Royal Plum', value: 'from-[#3B0764] via-[#6B21A8] to-[#1E0338]' },
  { name: 'Midnight Berry', value: 'from-[#4A0E17] via-[#8B1E3F] to-[#24050D]' },
  { name: 'Slate Onyx', value: 'from-[#1E293B] via-[#334155] to-[#0F172A]' },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'categories' | 'video' | 'sections' | 'faqs'>('hero');
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [categoryHeroes, setCategoryHeroes] = useState<Record<string, CategoryHero>>(DEFAULT_CATEGORY_HEROES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper for manual device file uploads (Images & Videos)
  const handleDeviceUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onComplete(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCampaignVideo = (updates: Partial<HomepageContent['campaignVideo']>) => {
    setHomepageContent((prev) => ({
      ...prev,
      campaignVideo: {
        ...(prev.campaignVideo || {
          title: "WE'VE GOT EVERYTHING COVERED",
          subtitle: 'High-performing, weightless luxury formulations designed to move with you all day long.',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-makeup-with-a-brush-41484-large.mp4',
          posterUrl: '/categories/face.jpg',
          tagline: 'THE GO-TO GLAM ROUTINE',
          ctaText: 'EXPLORE FULL CAMPAIGN',
          ctaLink: '/collections/all',
          active: true,
        }),
        ...updates,
      },
    }));
  };

  // Load content from Firestore
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [home, cats] = await Promise.all([getHomepageContent(), getCategoryHeroes()]);
        setHomepageContent(home);
        setCategoryHeroes(cats);
      } catch (err: any) {
        console.error('Failed to load content in Admin:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        saveHomepageContent(homepageContent),
        saveCategoryHeroes(categoryHeroes),
      ]);
      showNotification('success', 'Changes saved successfully to Firebase Firestore!');
    } catch (err: any) {
      console.error('Save failed:', err);
      showNotification('error', err.message || 'Failed to save content to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Reset all hero slides, categories, and homepage sections to default luxury content?')) return;
    try {
      setIsSaving(true);
      const res = await seedAllContentToFirestore();
      if (res.success) {
        setHomepageContent(DEFAULT_HOMEPAGE_CONTENT);
        setCategoryHeroes(DEFAULT_CATEGORY_HEROES);
        showNotification('success', 'Default luxury content initialized and stored in Firestore!');
      } else {
        showNotification('error', res.message);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Seeding failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- HERO SLIDE ACTIONS ----------------
  const handleUpdateSlide = (index: number, updates: Partial<HeroSlide>) => {
    const updated = [...homepageContent.heroSlides];
    updated[index] = { ...updated[index], ...updates };
    setHomepageContent({ ...homepageContent, heroSlides: updated });
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide_${Date.now()}`,
      tagline: 'NEW COLLECTION HIGHLIGHT',
      title: 'DISCOVER YOUR RADIANCE',
      subtitle: 'Luxury formulations designed for flawless skin and non-drying all-day wear',
      ctaText: 'EXPLORE COLLECTION',
      ctaLink: '/collections/all',
      imageUrl: '/brand/dimsglow-logo.jpg',
      bgGradient: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
      accentColor: '#B83B63',
      active: true,
      order: homepageContent.heroSlides.length + 1,
    };
    setHomepageContent({
      ...homepageContent,
      heroSlides: [...homepageContent.heroSlides, newSlide],
    });
  };

  const handleDeleteSlide = (index: number) => {
    if (homepageContent.heroSlides.length <= 1) {
      alert('You must retain at least one hero slide.');
      return;
    }
    const updated = homepageContent.heroSlides.filter((_, i) => i !== index);
    setHomepageContent({ ...homepageContent, heroSlides: updated });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const updated = [...homepageContent.heroSlides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setHomepageContent({ ...homepageContent, heroSlides: updated });
  };

  // ---------------- CATEGORY HERO ACTIONS ----------------
  const handleUpdateCategory = (key: string, updates: Partial<CategoryHero>) => {
    setCategoryHeroes({
      ...categoryHeroes,
      [key]: { ...categoryHeroes[key], ...updates },
    });
  };

  // ---------------- SECTION VISIBILITY ----------------
  const handleToggleSection = (key: keyof HomepageContent['sectionsVisibility']) => {
    setHomepageContent({
      ...homepageContent,
      sectionsVisibility: {
        ...homepageContent.sectionsVisibility,
        [key]: !homepageContent.sectionsVisibility[key],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B83B63]" />
        <p className="text-sm text-[#6D6670]">Loading dynamic site content from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Actions */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E8E2E7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#5B132B]/10 text-[#5B132B]">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-serif-brand text-[#19161A]">
              Dynamic Content & Sections CMS
            </h1>
            <Badge variant="accent" className="text-[10px]">
              Firebase Connected
            </Badge>
          </div>
          <p className="text-xs text-[#6D6670] mt-1">
            Manage hero carousel slides, category banners, promotional strips, and page layouts dynamically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="text-xs border-[#E8E2E7] gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View Live Storefront <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={isSaving}
            className="text-xs border-[#E8E2E7] text-[#6D6670] hover:text-[#19161A] gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="text-xs bg-[#5B132B] hover:bg-[#781838] gap-1.5 shadow-md"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save All Changes to Firebase
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in duration-200 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2E7] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'hero'
              ? 'bg-[#5B132B] text-white shadow-xs'
              : 'text-[#6D6670] hover:bg-white hover:text-[#19161A]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Hero Carousel Slides ({homepageContent.heroSlides.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-[#5B132B] text-white shadow-xs'
              : 'text-[#6D6670] hover:bg-white hover:text-[#19161A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Category Hero Banners ({Object.keys(categoryHeroes).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'video'
              ? 'bg-[#5B132B] text-white shadow-xs'
              : 'text-[#6D6670] hover:bg-white hover:text-[#19161A]'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Campaign Video Player
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'sections'
              ? 'bg-[#5B132B] text-white shadow-xs'
              : 'text-[#6D6670] hover:bg-white hover:text-[#19161A]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Homepage Sections & Layouts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'bg-[#5B132B] text-white shadow-xs'
              : 'text-[#6D6670] hover:bg-white hover:text-[#19161A]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          FAQs & Customer Q&A ({homepageContent.faqs?.length || 0})
        </button>
      </div>

      {/* TAB 1: HERO CAROUSEL SLIDES */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#19161A]">Hero Carousel Slides</h2>
              <p className="text-xs text-[#6D6670]">
                These slides auto-advance every 5 seconds on the storefront and can be reordered or customized anytime.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlide}
              className="text-xs gap-1.5 border-[#5B132B] text-[#5B132B] hover:bg-[#5B132B]/5"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Slide
            </Button>
          </div>

          <div className="space-y-4">
            {homepageContent.heroSlides.map((slide, idx) => (
              <Card key={slide.id || idx} className="border-[#E8E2E7] overflow-hidden shadow-xs">
                {/* Header row with gradient preview and order controls */}
                <div
                  className={`px-5 py-3.5 bg-gradient-to-r ${slide.bgGradient} text-white flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-widest text-[#D4AF37]">
                      Slide {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white/90 truncate max-w-sm">
                      {slide.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-black/20 hover:bg-black/40 disabled:opacity-30 text-white"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 'down')}
                      disabled={idx === homepageContent.heroSlides.length - 1}
                      className="p-1 rounded bg-black/20 hover:bg-black/40 disabled:opacity-30 text-white"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(idx)}
                      className="p-1 rounded bg-rose-500/30 hover:bg-rose-500/60 text-white ml-2"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Tagline / Top Pill
                      </label>
                      <Input
                        value={slide.tagline}
                        onChange={(e) => handleUpdateSlide(idx, { tagline: e.target.value })}
                        placeholder="e.g. NEW LAUNCH • TRANSFER-PROOF COLLECTION"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Slide Main Title (H1)
                      </label>
                      <Input
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(idx, { title: e.target.value })}
                        placeholder="e.g. LOCK THE SHINE"
                        className="text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Subtitle / Narrative
                    </label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => handleUpdateSlide(idx, { subtitle: e.target.value })}
                      placeholder="e.g. Flawless Vinyl Lip Color with Zero Touch-ups Required"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        CTA Button Text
                      </label>
                      <Input
                        value={slide.ctaText}
                        onChange={(e) => handleUpdateSlide(idx, { ctaText: e.target.value })}
                        placeholder="e.g. EXPLORE LIP LUXURY"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        CTA Button Link
                      </label>
                      <Input
                        value={slide.ctaLink}
                        onChange={(e) => handleUpdateSlide(idx, { ctaLink: e.target.value })}
                        placeholder="e.g. /collections/lips"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Emblem / Feature Image
                      </label>
                      <Input
                        value={slide.imageUrl}
                        onChange={(e) => handleUpdateSlide(idx, { imageUrl: e.target.value })}
                        placeholder="/brand/dimsglow-logo.jpg"
                        className="text-xs font-mono"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8FA] hover:bg-[#E8E2E7] border border-[#E8E2E7] rounded-md text-[11px] font-semibold text-[#19161A] transition-colors">
                          <Upload className="w-3.5 h-3.5 text-[#B83B63]" />
                          <span>Upload Image from Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleDeviceUpload(e, (dataUrl) =>
                                handleUpdateSlide(idx, { imageUrl: dataUrl })
                              )
                            }
                          />
                        </label>
                        {slide.imageUrl && (
                          <div className="relative w-8 h-8 rounded-full border border-[#D4AF37] overflow-hidden bg-white shrink-0">
                            <Image
                              src={slide.imageUrl}
                              alt="Slide preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gradient Presets */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1.5">
                      Background Gradient Theme
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleUpdateSlide(idx, { bgGradient: preset.value })}
                          className={`h-7 px-3 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${preset.value} border transition-all ${
                            slide.bgGradient === preset.value
                              ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-105'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY HERO BANNERS */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#19161A]">Category Hero Banners</h2>
            <p className="text-xs text-[#6D6670]">
              Control the top hero title, tagline, description, image, and gradient for each collection page.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(categoryHeroes).map(([key, cat]) => (
              <Card key={key} className="border-[#E8E2E7] overflow-hidden shadow-xs">
                {/* Banner Header Preview */}
                <div
                  className={`p-4 bg-gradient-to-r ${cat.bannerBg} text-white flex items-center justify-between`}
                >
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                      {cat.accentBadge || 'DIMSGLOW EXCLUSIVE'}
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{cat.bannerTitle}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white/10 text-white border-white/20">
                    /{cat.slug}
                  </Badge>
                </div>

                <CardContent className="p-4 space-y-3.5 bg-white">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Banner Heading (H1)
                    </label>
                    <Input
                      value={cat.bannerTitle}
                      onChange={(e) => handleUpdateCategory(key, { bannerTitle: e.target.value })}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Banner Subtitle
                    </label>
                    <Input
                      value={cat.bannerSubtitle}
                      onChange={(e) => handleUpdateCategory(key, { bannerSubtitle: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Accent Tag / Badge
                      </label>
                      <Input
                        value={cat.accentBadge}
                        onChange={(e) => handleUpdateCategory(key, { accentBadge: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Banner Image
                      </label>
                      <Input
                        value={cat.bannerImageUrl}
                        onChange={(e) => handleUpdateCategory(key, { bannerImageUrl: e.target.value })}
                        className="text-xs font-mono"
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF8FA] hover:bg-[#E8E2E7] border border-[#E8E2E7] rounded text-[10px] font-semibold text-[#19161A] transition-colors">
                          <Upload className="w-3 h-3 text-[#B83B63]" />
                          <span>Upload from Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleDeviceUpload(e, (dataUrl) =>
                                handleUpdateCategory(key, { bannerImageUrl: dataUrl })
                              )
                            }
                          />
                        </label>
                        {cat.bannerImageUrl && (
                          <div className="relative w-6 h-6 rounded border border-[#E8E2E7] overflow-hidden bg-white shrink-0">
                            <Image
                              src={cat.bannerImageUrl}
                              alt="Banner preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gradient Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Theme Gradient
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleUpdateCategory(key, { bannerBg: preset.value })}
                          className={`h-6 px-2.5 rounded text-[9px] font-bold text-white bg-gradient-to-r ${preset.value} border ${
                            cat.bannerBg === preset.value
                              ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPAIGN VIDEO PLAYER */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#19161A] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#B83B63]" /> Campaign Video Banner (Screenshot 2)
              </h2>
              <p className="text-xs text-[#6D6670]">
                Configure the auto-playing campaign video banner, headlines, CTA, and manual device video/poster uploads.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#19161A]">Active on Storefront:</span>
              <button
                type="button"
                onClick={() =>
                  handleUpdateCampaignVideo({
                    active: !homepageContent.campaignVideo?.active,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  homepageContent.campaignVideo?.active ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    homepageContent.campaignVideo?.active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Video Preview Box */}
            <div className="lg:col-span-5 space-y-3">
              <Card className="border-[#E8E2E7] overflow-hidden bg-black shadow-md">
                <div className="p-3 bg-[#1F161E] text-white border-b border-[#3B2C3A] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37]">LIVE VIDEO PREVIEW</span>
                  <span className="text-[10px] text-white/60 font-mono">16:9 Landscape</span>
                </div>
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video
                    src={homepageContent.campaignVideo?.videoUrl}
                    poster={homepageContent.campaignVideo?.posterUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  💡 Video Optimization Tip
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  You can upload any MP4 or WebM video file directly from your computer device, or paste a CDN video URL. The video automatically loops silently on user devices with custom controls.
                </p>
              </div>
            </div>

            {/* Campaign Video Settings Form */}
            <div className="lg:col-span-7">
              <Card className="border-[#E8E2E7] bg-white shadow-xs">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        Campaign Tagline Badge
                      </label>
                      <Input
                        value={homepageContent.campaignVideo?.tagline || ''}
                        onChange={(e) => handleUpdateCampaignVideo({ tagline: e.target.value })}
                        placeholder="e.g. THE GO-TO GLAM ROUTINE"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                        CTA Button Text
                      </label>
                      <Input
                        value={homepageContent.campaignVideo?.ctaText || ''}
                        onChange={(e) => handleUpdateCampaignVideo({ ctaText: e.target.value })}
                        placeholder="e.g. EXPLORE FULL CAMPAIGN"
                        className="text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Main Video Headline (H2)
                    </label>
                    <Input
                      value={homepageContent.campaignVideo?.title || ''}
                      onChange={(e) => handleUpdateCampaignVideo({ title: e.target.value })}
                      placeholder="WE'VE GOT EVERYTHING COVERED"
                      className="text-xs font-bold font-serif-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A] mb-1">
                      Subtitle / Narrative
                    </label>
                    <Input
                      value={homepageContent.campaignVideo?.subtitle || ''}
                      onChange={(e) => handleUpdateCampaignVideo({ subtitle: e.target.value })}
                      placeholder="High-performing, weightless luxury formulations designed to move with you all day long."
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E8E2E7]">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A]">
                      Campaign Video File / URL *
                    </label>
                    <Input
                      value={homepageContent.campaignVideo?.videoUrl || ''}
                      onChange={(e) => handleUpdateCampaignVideo({ videoUrl: e.target.value })}
                      placeholder="https://assets.mixkit.co/videos/preview/..."
                      className="text-xs font-mono"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8FA] hover:bg-[#E8E2E7] border border-[#E8E2E7] rounded-md text-xs font-semibold text-[#19161A] transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#B83B63]" />
                        <span>Upload Video from Device</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) =>
                            handleDeviceUpload(e, (dataUrl) =>
                              handleUpdateCampaignVideo({ videoUrl: dataUrl })
                            )
                          }
                        />
                      </label>
                      <span className="text-[10px] text-[#6D6670]">Supports MP4, WEBM</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E8E2E7]">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19161A]">
                      Video Poster Fallback Image
                    </label>
                    <Input
                      value={homepageContent.campaignVideo?.posterUrl || ''}
                      onChange={(e) => handleUpdateCampaignVideo({ posterUrl: e.target.value })}
                      placeholder="/categories/face.jpg"
                      className="text-xs font-mono"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8FA] hover:bg-[#E8E2E7] border border-[#E8E2E7] rounded-md text-xs font-semibold text-[#19161A] transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#B83B63]" />
                        <span>Upload Poster from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleDeviceUpload(e, (dataUrl) =>
                              handleUpdateCampaignVideo({ posterUrl: dataUrl })
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HOMEPAGE SECTIONS & PROMOS */}
      {activeTab === 'sections' && (
        <div className="space-y-8">
          {/* Section Visibility Switches */}
          <Card className="border-[#E8E2E7] bg-white shadow-xs">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#19161A]">Homepage Sections Visibility</h3>
                <p className="text-xs text-[#6D6670]">
                  Turn sections on or off on the public homepage with a single click.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {[
                  { key: 'heroCarousel', label: 'Hero Carousel' },
                  { key: 'categoryCircles', label: 'Category Quick Browse' },
                  { key: 'bestsellers', label: 'Best Sellers Showcase' },
                  { key: 'newArrivals', label: 'New Arrivals Grid' },
                  { key: 'campaignVideo', label: 'Campaign Video Player' },
                  { key: 'promoClinical', label: 'Clinical 95% Dark Spot' },
                  { key: 'routineLooks', label: 'Get The Look! Routines' },
                  { key: 'combosBox', label: 'Buy 3 for ₹699 Box' },
                  { key: 'beforeAfter', label: 'Before & After Slider' },
                  { key: 'ourPromise', label: 'Our Promise Trust Badges' },
                  { key: 'testimonials', label: 'Customer Testimonials' },
                  { key: 'faqs', label: 'Storefront FAQs' },
                  { key: 'trustMarquee', label: 'Footer Trust Marquee' },
                ].map((sec) => {
                  const isVisible = homepageContent.sectionsVisibility[sec.key as keyof typeof homepageContent.sectionsVisibility];
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => handleToggleSection(sec.key as keyof typeof homepageContent.sectionsVisibility)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isVisible
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-900 font-bold'
                          : 'border-[#E8E2E7] bg-[#FAF8FA] text-[#6D6670]'
                      }`}
                    >
                      <span className="text-xs">{sec.label}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isVisible ? 'bg-emerald-500 shadow-xs' : 'bg-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Clinical 95% Dark Spot Banner Settings */}
          <Card className="border-[#E8E2E7] bg-white shadow-xs">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#B83B63]/10 text-[#B83B63] uppercase">
                  CLINICAL PROMO STRIP
                </span>
                <h3 className="text-sm font-bold text-[#19161A]">Clinically Proven Formulation Banner</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    Stat Number
                  </label>
                  <Input
                    value={homepageContent.promoClinical.statNumber}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, statNumber: e.target.value },
                      })
                    }
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    Stat Label
                  </label>
                  <Input
                    value={homepageContent.promoClinical.statLabel}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, statLabel: e.target.value },
                      })
                    }
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    CTA Button Text
                  </label>
                  <Input
                    value={homepageContent.promoClinical.ctaText}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, ctaText: e.target.value },
                      })
                    }
                    className="text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                  Description Paragraph
                </label>
                <Input
                  value={homepageContent.promoClinical.description}
                  onChange={(e) =>
                    setHomepageContent({
                      ...homepageContent,
                      promoClinical: { ...homepageContent.promoClinical, description: e.target.value },
                    })
                  }
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    Featured Product Name
                  </label>
                  <Input
                    value={homepageContent.promoClinical.featuredProductName}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, featuredProductName: e.target.value },
                      })
                    }
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    Price Tag
                  </label>
                  <Input
                    value={homepageContent.promoClinical.featuredProductPrice}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, featuredProductPrice: e.target.value },
                      })
                    }
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#19161A] mb-1">
                    CTA Link URL
                  </label>
                  <Input
                    value={homepageContent.promoClinical.ctaLink}
                    onChange={(e) =>
                      setHomepageContent({
                        ...homepageContent,
                        promoClinical: { ...homepageContent.promoClinical, ctaLink: e.target.value },
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: FAQS & CUSTOMER Q&A */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#19161A]">Frequently Asked Questions (FAQ)</h2>
              <p className="text-xs text-[#6D6670]">
                Manage store questions, shipping policies, free gift thresholds, and return details.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newFaq: FaqItem = {
                  id: `faq_${Date.now()}`,
                  question: 'New Question Title?',
                  answer: 'Detailed explanation for verified customers.',
                  category: 'General',
                  order: (homepageContent.faqs?.length || 0) + 1,
                };
                setHomepageContent({
                  ...homepageContent,
                  faqs: [...(homepageContent.faqs || []), newFaq],
                });
              }}
              className="text-xs gap-1.5 border-[#5B132B] text-[#5B132B]"
            >
              <Plus className="w-3.5 h-3.5" /> Add New FAQ
            </Button>
          </div>

          <div className="space-y-3">
            {(homepageContent.faqs || []).map((faq, idx) => (
              <Card key={faq.id || idx} className="border-[#E8E2E7] bg-white shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B83B63]">
                    Q#{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = homepageContent.faqs.filter((_, i) => i !== idx);
                      setHomepageContent({ ...homepageContent, faqs: updated });
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                    Question
                  </label>
                  <Input
                    value={faq.question}
                    onChange={(e) => {
                      const updated = [...homepageContent.faqs];
                      updated[idx] = { ...updated[idx], question: e.target.value };
                      setHomepageContent({ ...homepageContent, faqs: updated });
                    }}
                    className="text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    rows={2}
                    onChange={(e) => {
                      const updated = [...homepageContent.faqs];
                      updated[idx] = { ...updated[idx], answer: e.target.value };
                      setHomepageContent({ ...homepageContent, faqs: updated });
                    }}
                    className="w-full text-xs rounded-md border border-[#E8E2E7] p-2 focus:border-[#5B132B] focus:ring-0"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
