import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../common/utils/cn';
import { Icon, type IconName } from '../../Icon';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: IconName;
  rightIcon?: IconName;
  error?: string;
  success?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    wrapperClassName,
    size,
    state,
    leftIcon,
    rightIcon,
    error,
    success,
    helperText,
    label,
    required,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const actualState = error ? 'error' : success ? 'success' : state || 'default';
    const message = error || success || helperText;
    const messageId = message ? `${inputId}-message` : undefined;

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon 
              name={leftIcon} 
              size="sm" 
              className={cn(
                'text-muted-foreground',
                actualState === 'error' && 'text-destructive',
                actualState === 'success' && 'text-green-600'
              )} 
            />
          </div>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({ size, state: actualState }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          aria-describedby={messageId}
          aria-invalid={actualState === 'error'}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon 
              name={rightIcon} 
              size="sm" 
              className={cn(
                'text-muted-foreground',
                actualState === 'error' && 'text-destructive',
                actualState === 'success' && 'text-green-600'
              )} 
            />
          </div>
        )}
      </div>
    );

    if (!label && !message) {
      return inputElement;
    }

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              actualState === 'error' && 'text-destructive'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        {inputElement}
        
        {message && (
          <p 
            id={messageId}
            className={cn(
              'text-sm',
              actualState === 'error' && 'text-destructive',
              actualState === 'success' && 'text-green-600',
              actualState === 'default' && 'text-muted-foreground'
            )}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';