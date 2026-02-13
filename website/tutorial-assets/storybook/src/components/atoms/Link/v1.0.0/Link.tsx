import * as React from 'react';
import { cn } from '../../../../common/utils/cn';

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, to, children, ...props }, ref) => {
    return (
      <a
        href={to}
        ref={ref}
        className={cn(
          "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline-offset-4 hover:underline",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
NavLink.displayName = 'NavLink';

const Link = NavLink;

export { NavLink, Link };