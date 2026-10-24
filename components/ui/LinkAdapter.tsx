import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children?: React.ReactNode;
  className?: string;
  replace?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, className, replace, ...rest }, ref) => {
    // External links or special protocols
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return (
        <a ref={ref} href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }

    // Anchor hash link on current page
    if (href.startsWith('#')) {
      return (
        <a ref={ref} href={href} className={className} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink ref={ref} to={href} className={className} replace={replace} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'Link';

export default Link;
