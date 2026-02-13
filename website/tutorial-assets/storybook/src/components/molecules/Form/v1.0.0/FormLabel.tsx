import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../utils/cn';
import { FormLabelProps } from './Form.types';

const formLabelVariants = cva(
  'leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
      },
      state: {
        default: 'text-foreground',
        error: 'text-destructive',
        disabled: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      weight: 'medium',
      state: 'default',
    },
  }
);

export interface FormLabelInternalProps
  extends Omit<FormLabelProps, 'size' | 'weight'>,
    VariantProps<typeof formLabelVariants> {
  size?: FormLabelProps['size'];
  weight?: FormLabelProps['weight'];
  state?: 'default' | 'error' | 'disabled';
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelInternalProps>(
  ({ 
    children,
    className,
    htmlFor,
    required = false,
    size = 'default',
    weight = 'medium',
    state = 'default',
    disabled = false,
    id,
    ...props 
  }, ref) => {
    const labelState = disabled ? 'disabled' : state;

    return (
      <label
        ref={ref}
        id={id}
        htmlFor={htmlFor}
        className={cn(
          formLabelVariants({ size, weight, state: labelState }),
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span 
            className="text-destructive ml-1" 
            aria-label="required"
            title="This field is required"
          >
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';