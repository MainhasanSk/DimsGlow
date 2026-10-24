'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface RadianceComparisonSliderProps {
  beforeImage?: string;
  afterImage?: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
}

export function RadianceComparisonSlider({
  beforeImage = '/product/skin-before.jpg',
  afterImage = '/product/skin-after.jpg',
  beforeAlt = 'Before DIMSGLOW Tinted Sunscreen - Natural Bare Skin',
  afterAlt = 'After DIMSGLOW Tinted Sunscreen - Radiant & Flawless Glass Skin',
  className = '',
}: RadianceComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only drag when primary button is pressed
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(Math.round(percentage));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Interactive Comparison Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Day 1 vs Day 14 Radiance Comparison Slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative aspect-4/3 sm:aspect-16/10 w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#E8E2E7] shadow-xl bg-[#FAF8FA] select-none touch-none focus:outline-none focus:ring-2 focus:ring-[#B83B63] group"
      >
        {/* Layer 1: AFTER (Bottom Base Layer - visible on the right) */}
        <div className="absolute inset-0">
          <Image
            src={afterImage}
            alt={afterAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 700px, 800px"
            className="object-cover object-center pointer-events-none"
            priority
          />
          {/* After Floating Badge (Anchored Bottom-Right) */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right max-w-[200px] sm:max-w-[260px]">
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#18794E]/90 text-white px-3 py-1 rounded-full shadow-md backdrop-blur-xs border border-white/20">
              AFTER: RADIANT & FLAWLESS
            </span>
            <p className="text-[10px] sm:text-xs text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-semibold mt-1 hidden sm:block">
              Glowing skin texture, blurred pores, zero cakey residue.
            </p>
          </div>
        </div>

        {/* Layer 2: BEFORE (Top Clipped Layer - visible on the left) */}
        <div
          className="absolute inset-0 will-change-[clip-path]"
          style={{
            clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`,
          }}
        >
          <Image
            src={beforeImage}
            alt={beforeAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 700px, 800px"
            className="object-cover object-center pointer-events-none"
            priority
          />
          {/* Before Floating Badge (Anchored Bottom-Left) */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-left max-w-[200px] sm:max-w-[260px]">
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/75 text-white px-3 py-1 rounded-full shadow-md backdrop-blur-xs border border-white/20">
              BEFORE: NATURAL BARE SKIN
            </span>
            <p className="text-[10px] sm:text-xs text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-semibold mt-1 hidden sm:block">
              Uneven tones, visible pores, redness, and dark spots.
            </p>
          </div>
        </div>

        {/* Vertical Split Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.7)] z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Center Handle Knob */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-[#D4AF37] text-[#19161A] flex items-center justify-center text-xs sm:text-sm font-black shadow-2xl transition-transform group-hover:scale-105">
            <span className="text-[#B83B63] select-none tracking-tighter font-extrabold">◀ ‖ ▶</span>
          </div>
        </div>

        {/* Native Touch & Range Controller covering container for instant frictionless swipe */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          aria-label="Before and after transformation slider"
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
        />

        {/* Subtle drag instruction hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-md border border-white/10">
            Drag arrow left / right to compare
          </span>
        </div>
      </div>

      {/* External Synchronized Slider Bar */}
      <div className="max-w-md mx-auto space-y-1.5 px-4">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-[#6D6670] uppercase">◀ Before: Bare Skin</span>
          <span className="text-[#18794E] uppercase">After: Radiant Glow ▶</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          aria-label="Radiance transformation slider track"
          className="w-full accent-[#B83B63] cursor-pointer h-2 bg-[#E8E2E7] rounded-lg"
        />
      </div>
    </div>
  );
}
