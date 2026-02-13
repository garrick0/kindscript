import React from 'react';

/**
 * Validation state for individual form fields
 */
export interface FormFieldValidationState {
  isValid?: boolean;
  isDirty?: boolean;
  isTouched?: boolean;
  error?: string;
  value?: any;
}

/**
 * Overall form validation state
 */
export interface FormValidationState {
  isValid?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  values?: Record<string, any>;
  touched?: Record<string, boolean>;
}

/**
 * Form context interface for managing form state
 */
export interface FormContextProps {
  validation: FormValidationState;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string) => boolean;
  validateForm: () => boolean;
  submitForm: () => void;
  resetForm: () => void;
}

/**
 * Base props for form-related components
 */
export interface FormBaseProps {
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * FormLabel component props
 */
export interface FormLabelProps extends FormBaseProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  size?: 'sm' | 'default' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold';
}

/**
 * FormHelperText component props
 */
export interface FormHelperTextProps extends FormBaseProps {
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'success' | 'warning';
  size?: 'sm' | 'default';
}

/**
 * FormGroup component props
 */
export interface FormGroupProps extends FormBaseProps {
  children: React.ReactNode;
  legend?: string;
  description?: string;
  error?: string | boolean;
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'sm' | 'default' | 'lg';
}

/**
 * FormField component props - the main wrapper component
 */
export interface FormFieldProps extends FormBaseProps {
  children: React.ReactNode;
  
  // Labeling
  label?: string | React.ReactNode;
  labelProps?: Omit<FormLabelProps, 'children' | 'htmlFor'>;
  required?: boolean;
  
  // Help and validation
  helperText?: string | React.ReactNode;
  error?: string | React.ReactNode;
  success?: string | React.ReactNode;
  warning?: string | React.ReactNode;
  
  // Layout
  layout?: 'vertical' | 'horizontal';
  labelWidth?: string | number;
  
  // Form field name for context integration
  name?: string;
  
  // Accessibility
  describedBy?: string;
}

/**
 * Form component props - the root form wrapper
 */
export interface FormProps extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  children: React.ReactNode;
  initialValues?: Record<string, any>;
  validationSchema?: any; // Could be Yup, Zod, or custom validation schema
  onSubmit?: (values: Record<string, any>, actions: FormContextProps) => void | Promise<void>;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  enableReinitialize?: boolean;
}

/**
 * Form field layout configurations
 */
export type FormLayoutConfig = {
  layout: 'vertical' | 'horizontal';
  labelWidth?: string;
  spacing?: 'sm' | 'default' | 'lg';
  alignment?: 'start' | 'center' | 'end';
};

/**
 * Form validation rule types
 */
export type ValidationRule = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  custom?: (value: any) => boolean | string;
};

/**
 * Form field registration for context
 */
export interface FormFieldRegistration {
  name: string;
  rules?: ValidationRule;
  defaultValue?: any;
}