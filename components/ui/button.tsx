import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary:
        'bg-[#B83B63] hover:bg-[#982D50] text-white shadow-sm focus-visible:ring-[#B83B63] active:scale-[0.98]',
      secondary:
        'bg-[#FBEAF0] text-[#B83B63] hover:bg-[#f6d7e2] focus-visible:ring-[#B83B63]',
      outline:
        'border border-[#E8E2E7] bg-white text-[#19161A] hover:bg-[#F7F5F7] hover:border-[#B83B63] focus-visible:ring-[#B83B63]',
      ghost:
        'text-[#19161A] hover:bg-[#F7F5F7] hover:text-[#B83B63] focus-visible:ring-[#B83B63]',
      danger:
        'bg-[#B42318] text-white hover:bg-[#911a12] focus-visible:ring-[#B42318]',
      gold:
        'bg-linear-to-r from-[#D4AF37] to-[#AA771C] text-white hover:brightness-105 shadow-md focus-visible:ring-[#D4AF37]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-sm h-8 gap-1.5',
      md: 'text-sm px-4 py-2 rounded-md h-10 gap-2',
      lg: 'text-base px-6 py-3 rounded-lg h-12 gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0 rounded-md items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
