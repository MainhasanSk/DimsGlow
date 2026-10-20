'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface RadianceComparisonSliderProps {
  beforeImage?: string;
  afterImage?: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
}

export function RadianceComparisonSlider({
  beforeImage = 'https://res.cloudinary.com/web8vmww/image/upload/v1792431841/dimsglow/editorial/day1_before_clean_radiance.jpg',
  afterImage = 'https://res.cloudinary.com/web8vmww/image/upload/v1792431843/dimsglow/editorial/day14_after_clean_radiance.jpg',
  beforeAlt = 'Day 1 Before Radiance Treatment',
  afterAlt = 'Day 14 After Glass Skin Radiance Treatment',
  className = '',
}: RadianceComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(Math.round(percentage));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Interactive Face Comparison Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Day 1 vs Day 14 Radiance Comparison Slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative aspect-square w-full max-w-[260px] sm:max-w-sm lg:max-w-md mx-auto rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-2xl bg-[#FAF8FA] select-none cursor-ew-resize touch-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
      >
        {/* Layer 1: DAY 14 AFTER RADIANCE (Bottom Full Layer - visible on the right) */}
        <div className="absolute inset-0">
          <Image
            src={afterImage}
            alt={afterAlt}
            fill
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 384px, 448px"
            className="object-cover object-center pointer-events-none"
            priority
          />
        </div>

        {/* Layer 2: DAY 1 BEFORE (Top Layer clipped dynamically from 0 to sliderPosition - visible on the left) */}
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
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 384px, 448px"
            className="object-cover object-center pointer-events-none"
            priority
          />
        </div>

        {/* Floating Badges on Image */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <span className="bg-black/75 backdrop-blur-md text-[#FAF8FA] border border-white/20 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
            Day 1 • Before
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <span className="bg-[#5B132B]/90 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/60 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Day 14 • Radiance
          </span>
        </div>

        {/* Interactive Vertical Divider Line & Draggable Knob */}
        <div
          className="absolute top-0 bottom-0 w-0.5 sm:w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-30 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Arrow Divider Knob */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5B132B] border-2 border-[#D4AF37] text-white flex items-center justify-center text-xs sm:text-sm font-extrabold shadow-2xl transition-transform active:scale-110 pointer-events-auto cursor-ew-resize">
            <span className="text-[#D4AF37] tracking-tighter">◀ ‖ ▶</span>
          </div>
        </div>

        {/* Subtle drag instruction hint */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
          <span className="bg-black/60 backdrop-blur-xs text-white/90 text-[8px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
            Drag arrow left / right to compare
          </span>
        </div>
      </div>

      {/* External Position Indicators */}
      <div className="flex justify-between items-center px-1 max-w-[260px] sm:max-w-sm lg:max-w-md mx-auto">
        <span className="text-[9px] sm:text-xs font-bold text-[#6D6670] uppercase">
          ◀ Day 1 (Before)
        </span>
        <span className="text-[9px] sm:text-xs font-bold text-[#5B132B] uppercase">
          Day 14 (Radiant) ▶
        </span>
      </div>

      {/* Synchronized Slider Range Input */}
      <div className="flex items-center gap-2 max-w-[260px] sm:max-w-sm lg:max-w-md mx-auto">
        <span className="text-[9px] sm:text-[11px] font-bold text-[#6D6670] uppercase shrink-0">Day 1</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          aria-label="Radiance transformation slider"
          className="w-full accent-[#5B132B] cursor-pointer h-1.5 sm:h-2"
        />
        <span className="text-[9px] sm:text-[11px] font-bold text-[#5B132B] uppercase shrink-0">Day 14</span>
      </div>
    </div>
  );
}
