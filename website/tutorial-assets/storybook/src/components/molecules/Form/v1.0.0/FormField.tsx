import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../utils/cn';
import { FormFieldProps } from './Form.types';
import { FormLabel } from './FormLabel';
import { FormHelperText } from './FormHelperText';
import { useOptionalFormContext } from './FormContext';

const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      layout: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row items-start gap-4',
      },
    },
    defaultVariants: {
      layout: 'vertical',
    },
  }
);

const formFieldLabelContainerVariants = cva(
  '',
  {
    variants: {
      layout: {
        vertical: '',
        horizontal: 'flex-shrink-0',
      },
    },
    defaultVariants: {
      layout: 'vertical',
    },
  }
);

const formFieldContentVariants = cva(
  'space-y-2',
  {
    variants: {
      layout: {
        vertical: '',
        horizontal: 'flex-1 min-w-0',
      },
    },
    defaultVariants: {
      layout: 'vertical',
    },
  }
);

export interface FormFieldInternalProps
  extends Omit<FormFieldProps, 'layout'>,
    VariantProps<typeof formFieldVariants> {
  layout?: FormFieldProps['layout'];
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldInternalProps>(
  ({ 
    children,
    className,
    label,
    labelProps,
    required = false,
    helperText,
    error,
    success,
    warning,
    layout = 'vertical',
    labelWidth,
    name,
    describedBy,
    disabled = false,
    id: providedId,
    ...props 
  }, ref) => {
    const formContext = useOptionalFormContext();
    
    // Generate unique IDs for accessibility
    const fieldId = providedId || name || `form-field-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = `${fieldId}-label`;
    const helperTextId = helperText ? `${fieldId}-helper` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;
    const successId = success ? `${fieldId}-success` : undefined;
    const warningId = warning ? `${fieldId}-warning` : undefined;
    
    // Get form context values if available
    const contextError = name && formContext?.validation.errors?.[name];
    const contextValue = name && formContext?.validation.values?.[name];
        // Determine final values (props override context)
    const finalError = error || contextError;
    const hasError = Boolean(finalError);
    const hasSuccess = Boolean(success && !hasError);
    const hasWarning = Boolean(warning && !hasError && !hasSuccess);
    
    // Build describedBy string
    const describedByIds = [
      describedBy,
      helperTextId,
      hasError && errorId,
      hasSuccess && successId,
      hasWarning && warningId,
    ].filter(Boolean).join(' ');
    
    // Clone children to add accessibility props
    const enhancedChildren = React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          id: fieldId,
          name: name || children.props.name,
          'aria-describedby': describedByIds || undefined,
          'aria-invalid': hasError || undefined,
          'aria-required': required || undefined,
          disabled: disabled || children.props.disabled,
          // If we have form context, pass value and change handlers
          ...(name && formContext ? {
            value: contextValue ?? children.props.value ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              formContext.setFieldValue(name, e.target.value);
              children.props.onChange?.(e);
            },
            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
              formContext.setFieldTouched(name, true);
              children.props.onBlur?.(e);
            },
          } : {}),
        })
      : children;

    const labelElement = label && (
      <div 
        className={cn(
          formFieldLabelContainerVariants({ layout }),
          layout === 'horizontal' && labelWidth && { width: labelWidth }
        )}
      >
        <FormLabel
          id={labelId}
          htmlFor={fieldId}
          required={required}
          state={hasError ? 'error' : disabled ? 'disabled' : 'default'}
          disabled={disabled}
          {...labelProps}
        >
          {label}
        </FormLabel>
      </div>
    );

    const contentElement = (
      <div className={cn(formFieldContentVariants({ layout }))}>
        {enhancedChildren}
        
        {/* Helper text (shown when no error/success/warning) */}
        {helperText && !hasError && !hasSuccess && !hasWarning && (
          <FormHelperText 
            id={helperTextId}
            variant="default"
            disabled={disabled}
          >
            {helperText}
          </FormHelperText>
        )}
        
        {/* Error message */}
        {finalError && (
          <FormHelperText 
            id={errorId}
            variant="error"
            disabled={disabled}
          >
            {finalError}
          </FormHelperText>
        )}
        
        {/* Success message */}
        {hasSuccess && (
          <FormHelperText 
            id={successId}
            variant="success"
            disabled={disabled}
          >
            {success}
          </FormHelperText>
        )}
        
        {/* Warning message */}
        {hasWarning && (
          <FormHelperText 
            id={warningId}
            variant="warning"
            disabled={disabled}
          >
            {warning}
          </FormHelperText>
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ layout }), className)}
        {...props}
      >
        {layout === 'vertical' ? (
          <>
            {labelElement}
            {contentElement}
          </>
        ) : (
          <>
            {labelElement}
            {contentElement}
          </>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';