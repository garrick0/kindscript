import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../utils/cn';
import { FormGroupProps } from './Form.types';
import { FormLabel } from './FormLabel';
import { FormHelperText } from './FormHelperText';

const formGroupVariants = cva(
  'border rounded-lg',
  {
    variants: {
      orientation: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row flex-wrap items-start',
      },
      spacing: {
        sm: 'gap-2 p-3',
        default: 'gap-4 p-4',
        lg: 'gap-6 p-6',
      },
      state: {
        default: 'border-border bg-card',
        error: 'border-destructive bg-destructive/5',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
      spacing: 'default',
      state: 'default',
    },
  }
);

const formGroupContentVariants = cva(
  '',
  {
    variants: {
      orientation: {
        vertical: 'space-y-4',
        horizontal: 'flex-1 grid grid-cols-1 md:grid-cols-2 gap-4',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  }
);

export interface FormGroupInternalProps
  extends Omit<FormGroupProps, 'orientation' | 'spacing'>,
    VariantProps<typeof formGroupVariants> {
  orientation?: FormGroupProps['orientation'];
  spacing?: FormGroupProps['spacing'];
  state?: 'default' | 'error';
}

export const FormGroup = React.forwardRef<HTMLFieldSetElement, FormGroupInternalProps>(
  ({ 
    children,
    className,
    legend,
    description,
    error,
    orientation = 'vertical',
    spacing = 'default',
    disabled = false,
    id,
    ...props 
  }, ref) => {
    const hasError = Boolean(error);
    const state = hasError ? 'error' : 'default';
    const errorMessage = typeof error === 'string' ? error : undefined;
    const fieldsetId = id || `form-group-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${fieldsetId}-description` : undefined;
    const errorId = errorMessage ? `${fieldsetId}-error` : undefined;
    
    return (
      <fieldset
        ref={ref}
        id={fieldsetId}
        disabled={disabled}
        className={cn(
          formGroupVariants({ orientation, spacing, state }),
          className
        )}
        aria-describedby={cn(descriptionId, errorId).trim() || undefined}
        aria-invalid={hasError}
        {...props}
      >
        {legend && (
          <legend className="sr-only">
            {legend}
          </legend>
        )}
        
        {(legend || description) && (
          <div className="space-y-1 mb-2">
            {legend && (
              <FormLabel 
                size="lg" 
                weight="semibold"
                state={hasError ? 'error' : 'default'}
              >
                {legend}
              </FormLabel>
            )}
            
            {description && (
              <FormHelperText 
                id={descriptionId}
                variant="default"
                size="sm"
              >
                {description}
              </FormHelperText>
            )}
          </div>
        )}
        
        <div className={cn(formGroupContentVariants({ orientation }))}>
          {children}
        </div>
        
        {errorMessage && (
          <FormHelperText 
            id={errorId}
            variant="error"
            size="sm"
          >
            {errorMessage}
          </FormHelperText>
        )}
      </fieldset>
    );
  }
);

FormGroup.displayName = 'FormGroup';