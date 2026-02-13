import React from 'react';
import { cn } from '../../../../utils/cn';
import { FormProvider, FormProviderProps } from './FormContext';

export interface FormProps extends Omit<FormProviderProps, 'children'> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form component that provides form state management and validation
 * 
 * This is the root wrapper for forms that need state management. 
 * For simple forms without state management, you can use HTML form directly with FormField components.
 */
export const Form = React.forwardRef<HTMLDivElement, FormProps>(
  ({ 
    children,
    className,
    ...props 
  }, ref) => {
    return (
      <FormProvider {...props}>
        <div ref={ref} className={cn('space-y-6', className)}>
          {children}
        </div>
      </FormProvider>
    );
  }
);

Form.displayName = 'Form';