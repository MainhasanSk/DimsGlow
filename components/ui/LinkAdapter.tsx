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
        <a
          ref={ref}
          href={href}
          className={className}
          onClick={(e) => {
            if (rest.onClick) rest.onClick(e);
            if (!e.defaultPrevented) {
              const el = document.querySelector(href);
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', href);
              }
            }
          }}
          {...rest}
        >
          {children}
        </a>
      );
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (rest.onClick) rest.onClick(e);
      if (e.defaultPrevented) return;

      const hashIndex = href.indexOf('#');
      if (hashIndex !== -1) {
        const hash = href.slice(hashIndex);
        const path = href.slice(0, hashIndex) || '/';
        const currentPath = window.location.pathname;

        if (currentPath === path || (path === '/' && (currentPath === '' || currentPath === '/'))) {
          const el = document.querySelector(hash);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, '', href);
          }
        }
      }
    };

    return (
      <RouterLink ref={ref} to={href} className={className} replace={replace} onClick={handleClick} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'Link';

export default Link;
