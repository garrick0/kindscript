import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../common/utils/cn';

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{ label: string; href?: string }>;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items = [], ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-1 text-sm text-gray-500", className)}
        {...props}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <a
                href={item.href}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs };