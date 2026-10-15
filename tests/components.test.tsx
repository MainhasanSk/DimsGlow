import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatPricePaise } from '@/lib/utils';

describe('UI Primitives and Design System', () => {
  it('renders Button with primary styling and triggers onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Add To Cart</Button>);
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state with disabled attribute', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('renders Badge with correct variant content', () => {
    render(<Badge variant="freeGift">UNLOCK FREE GIFT</Badge>);
    expect(screen.getByText('UNLOCK FREE GIFT')).toBeDefined();
  });

  it('renders Input with accessible label and error association', () => {
    render(
      <Input
        label="Enter Pincode"
        placeholder="e.g. 400001"
        error="Invalid postal code format"
      />
    );
    const input = screen.getByLabelText(/enter pincode/i);
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/invalid postal code format/i)).toBeDefined();
  });

  it('correctly formats paise to Indian Rupee strings', () => {
    expect(formatPricePaise(31900)).toBe('₹319.00');
    expect(formatPricePaise(24000)).toBe('₹240.00');
    expect(formatPricePaise(0)).toBe('₹0.00');
  });
});
