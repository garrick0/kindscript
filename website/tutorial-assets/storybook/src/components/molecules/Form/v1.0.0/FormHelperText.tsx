import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../utils/cn';
import { FormHelperTextProps } from './Form.types';

const formHelperTextVariants = cva(
  'block leading-relaxed',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
      },
      variant: {
        default: 'text-muted-foreground',
        error: 'text-destructive',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface FormHelperTextInternalProps
  extends Omit<FormHelperTextProps, 'size' | 'variant'>,
    VariantProps<typeof formHelperTextVariants> {
  size?: FormHelperTextProps['size'];
  variant?: FormHelperTextProps['variant'];
}

export const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextInternalProps>(
  ({ 
    children,
    className,
    variant = 'default',
    size = 'default',
    disabled = false,
    id,
    ...props 
  }, ref) => {
    if (!children) return null;

    return (
      <p
        ref={ref}
        id={id}
        className={cn(
          formHelperTextVariants({ size, variant }),
          disabled && 'opacity-50',
          className
        )}
        role={variant === 'error' ? 'alert' : undefined}
        aria-live={variant === 'error' ? 'polite' : undefined}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormHelperText.displayName = 'FormHelperText';