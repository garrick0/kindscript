import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../common/utils/cn';
import { Icon, type IconName } from '../../../atoms/Icon/v1.0.0/Icon';

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100',
        warning: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100',
        info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <Icon name="close" size="sm" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

// Composite components for easier usage
interface ToastWithIconProps {
  variant?: VariantProps<typeof toastVariants>['variant'];
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  duration?: number;
  className?: string;
}

const getVariantIcon = (variant: ToastWithIconProps['variant']): IconName => {
  switch (variant) {
    case 'success':
      return 'check';
    case 'destructive':
      return 'alert-circle';
    case 'warning':
      return 'alert-triangle';
    case 'info':
      return 'info';
    default:
      return 'bell';
  }
};

const getVariantIconColor = (variant: ToastWithIconProps['variant']) => {
  switch (variant) {
    case 'success':
      return 'success';
    case 'destructive':
      return 'destructive';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Simple toast component with icon, title, description, and optional action.
 * 
 * @example
 * ```tsx
 * <SimpleToast 
 *   variant="success"
 *   title="Success!"
 *   description="Your changes have been saved."
 * />
 * ```
 */
export const SimpleToast = React.forwardRef<
  React.ElementRef<typeof Toast>,
  ToastWithIconProps
>(({ variant = 'default', title, description, action, onClose, className, ...props }, ref) => (
  <Toast ref={ref} variant={variant} className={className} {...props}>
    <div className="flex items-start space-x-3">
      <Icon 
        name={getVariantIcon(variant)} 
        size="sm" 
        color={getVariantIconColor(variant) as any}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <ToastTitle>{title}</ToastTitle>
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action && (
        <ToastAction onClick={action.onClick} altText={`${action.label} action`}>
          {action.label}
        </ToastAction>
      )}
    </div>
    <ToastClose />
  </Toast>
));
SimpleToast.displayName = 'SimpleToast';

// Hook for managing toast state
export interface ToastState {
  id: string;
  title: string;
  description?: string;
  variant?: ToastWithIconProps['variant'];
  action?: ToastWithIconProps['action'];
  duration?: number;
}

type ToastActionType = 
  | { type: 'ADD_TOAST'; toast: ToastState }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_ALL' };

const toastReducer = (state: ToastState[], action: ToastActionType): ToastState[] => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.toast];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.id);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};

const ToastContext = React.createContext<{
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
} | null>(null);

/**
 * Toast provider component that manages toast state and provides context.
 * Wrap your app or section with this provider to enable toast functionality.
 */
export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = React.useReducer(toastReducer, []);

  const addToast = React.useCallback((toast: Omit<ToastState, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toastWithId = { ...toast, id };
    dispatch({ type: 'ADD_TOAST', toast: toastWithId });
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, toast.duration || 5000);
    }
    
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const clearAll = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      <ToastProvider>
        {children}
        <ToastViewport />
        {toasts.map((toast) => (
          <SimpleToast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast functionality
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContextProvider');
  }
  return context;
};

export {
  type ToastProps,
  type ToastActionProps,
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastAction>;