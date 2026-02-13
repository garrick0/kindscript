import React from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import { cn } from '../../../../utils/cn';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  required,
  disabled,
  helpText,
  className,
  inputClassName,
  autoComplete,
  autoFocus,
}: FormFieldProps<T>) {
  const fieldId = `field-${name}`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...register(name)}
          id={fieldId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={cn(
            'w-full px-3 py-2 border rounded-lg shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
              : 'border-gray-300 text-gray-900 placeholder-gray-400',
            inputClassName
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
          }
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-600">
          {error.message}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${fieldId}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}

// TextArea variant
export interface TextAreaFieldProps<T extends FieldValues> extends Omit<FormFieldProps<T>, 'type'> {
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export function TextAreaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  error,
  required,
  disabled,
  helpText,
  className,
  inputClassName,
  rows = 4,
  maxLength,
  showCount,
  autoFocus,
}: TextAreaFieldProps<T>) {
  const fieldId = `field-${name}`;
  const [count, setCount] = React.useState(0);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          {...register(name)}
          id={fieldId}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onChange={(e) => {
            if (showCount) {
              setCount(e.target.value.length);
            }
          }}
          className={cn(
            'w-full px-3 py-2 border rounded-lg shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
              : 'border-gray-300 text-gray-900 placeholder-gray-400',
            inputClassName
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
          }
        />
        
        {error && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          {error && (
            <p id={`${fieldId}-error`} className="text-sm text-red-600">
              {error.message}
            </p>
          )}
          
          {helpText && !error && (
            <p id={`${fieldId}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
        </div>
        
        {showCount && maxLength && (
          <span className="text-sm text-gray-500">
            {count}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

// Select Field
export interface SelectFieldProps<T extends FieldValues> extends Omit<FormFieldProps<T>, 'type'> {
  options: Array<{ value: string; label: string }>;
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  register,
  error,
  required,
  disabled,
  helpText,
  className,
  inputClassName,
  options,
}: SelectFieldProps<T>) {
  const fieldId = `field-${name}`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        {...register(name)}
        id={fieldId}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-lg shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error
            ? 'border-red-300 text-red-900 focus:ring-red-500'
            : 'border-gray-300 text-gray-900',
          inputClassName
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
        }
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-600">
          {error.message}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${fieldId}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}

// Checkbox Field
export interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  disabled?: boolean;
  helpText?: string;
  className?: string;
}

export function CheckboxField<T extends FieldValues>({
  name,
  label,
  register,
  error,
  disabled,
  helpText,
  className,
}: CheckboxFieldProps<T>) {
  const fieldId = `field-${name}`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            {...register(name)}
            id={fieldId}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border-gray-300',
              'focus:ring-2 focus:ring-blue-500',
              'disabled:bg-gray-50',
              error
                ? 'text-red-600 focus:ring-red-500'
                : 'text-blue-600'
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
            }
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          {helpText && (
            <p id={`${fieldId}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-600 ml-7">
          {error.message}
        </p>
      )}
    </div>
  );
}