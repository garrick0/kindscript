import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../common/utils/cn';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-md',
        outlined: 'border-2',
        ghost: 'border-transparent shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, noPadding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ 
          variant, 
          padding: noPadding ? 'none' : padding 
        }),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 3, ...props }, ref) => {
    const commonClassName = cn(
      'text-2xl font-semibold leading-none tracking-tight',
      level === 1 && 'text-4xl',
      level === 2 && 'text-3xl',
      level === 3 && 'text-2xl',
      level === 4 && 'text-xl',
      level === 5 && 'text-lg',
      level === 6 && 'text-base',
      className
    );
    
    switch (level) {
      case 1:
        return <h1 ref={ref} className={commonClassName} {...props} />;
      case 2:
        return <h2 ref={ref} className={commonClassName} {...props} />;
      case 3:
        return <h3 ref={ref} className={commonClassName} {...props} />;
      case 4:
        return <h4 ref={ref} className={commonClassName} {...props} />;
      case 5:
        return <h5 ref={ref} className={commonClassName} {...props} />;
      case 6:
        return <h6 ref={ref} className={commonClassName} {...props} />;
      default:
        return <h3 ref={ref} className={commonClassName} {...props} />;
    }
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn('p-6 pt-0', className)} 
      {...props} 
    />
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';