import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'freeGift' | 'accent' | 'soft' | 'success' | 'warning' | 'danger' | 'gold' | 'outline';
}

export function Badge({ className, variant = 'soft', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-[4px] transition-colors';

  const variants = {
    freeGift: 'bg-[#B83B63] text-white shadow-xs',
    accent: 'bg-[#B83B63] text-white',
    soft: 'bg-[#FBEAF0] text-[#B83B63]',
    success: 'bg-[#E6F4EA] text-[#18794E]',
    warning: 'bg-[#FEF7E0] text-[#946200]',
    danger: 'bg-[#FCE8E6] text-[#B42318]',
    gold: 'bg-[#FFF8E7] text-[#AA771C] border border-[#F3E5AB]',
    outline: 'border border-[#E8E2E7] text-[#6D6670] bg-white',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
