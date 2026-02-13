import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { FormContextProps, FormValidationState, FormProps, ValidationRule } from './Form.types';

// Form state management using useReducer
type FormAction =
  | { type: 'SET_FIELD_VALUE'; payload: { name: string; value: any } }
  | { type: 'SET_FIELD_ERROR'; payload: { name: string; error: string } }
  | { type: 'SET_FIELD_TOUCHED'; payload: { name: string; touched: boolean } }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM'; payload: Record<string, any> }
  | { type: 'SET_VALIDATION_STATE'; payload: Partial<FormValidationState> };

const formReducer = (state: FormValidationState, action: FormAction): FormValidationState => {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        values: {
          ...state.values,
          [action.payload.name]: action.payload.value,
        },
        isDirty: true,
      };
    
    case 'SET_FIELD_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.name]: action.payload.error,
        },
        isValid: false,
      };
    
    case 'SET_FIELD_TOUCHED':
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.payload.name]: action.payload.touched,
        },
      };
    
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
    
    case 'RESET_FORM':
      return {
        values: action.payload,
        errors: {},
        touched: {},
        isValid: true,
        isDirty: false,
        isSubmitting: false,
      };
    
    case 'SET_VALIDATION_STATE':
      return {
        ...state,
        ...action.payload,
      };
    
    default:
      return state;
  }
};

const FormContext = createContext<FormContextProps | null>(null);

export const useFormContext = (): FormContextProps => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Hook for optional form context (doesn't throw if not in form)
export const useOptionalFormContext = (): FormContextProps | null => {
  return useContext(FormContext);
};

// Simple validation function
const validateValue = (value: any, rules: ValidationRule): string | undefined => {
  if (rules.required) {
    const isRequired = typeof rules.required === 'boolean' ? rules.required : true;
    const message = typeof rules.required === 'string' ? rules.required : 'This field is required';
    
    if (isRequired && (value === undefined || value === null || value === '')) {
      return message;
    }
  }
  
  if (value && rules.minLength) {
    const min = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
    const message = typeof rules.minLength === 'object' ? rules.minLength.message : `Minimum length is ${min}`;
    
    if (String(value).length < min) {
      return message;
    }
  }
  
  if (value && rules.maxLength) {
    const max = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
    const message = typeof rules.maxLength === 'object' ? rules.maxLength.message : `Maximum length is ${max}`;
    
    if (String(value).length > max) {
      return message;
    }
  }
  
  if (value && rules.pattern) {
    const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern ? rules.pattern.value : rules.pattern as RegExp;
    const message = typeof rules.pattern === 'object' && 'message' in rules.pattern ? rules.pattern.message : 'Invalid format';
    
    if (!pattern.test(String(value))) {
      return message;
    }
  }
  
  if (rules.custom) {
    const result = rules.custom(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return 'Invalid value';
    }
  }
  
  return undefined;
};

export interface FormProviderProps extends FormProps {
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({
  children,
  initialValues = {},
  onSubmit,
  onValidationChange,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnSubmit = true,
  enableReinitialize = false,
  ...formProps
}) => {
  const [state, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
    isSubmitting: false,
  });

  // Validation rules registry
  const [validationRules] = React.useState<Record<string, ValidationRule>>({});

  const setFieldValue = useCallback((name: string, value: any) => {
    dispatch({ type: 'SET_FIELD_VALUE', payload: { name, value } });
    
    if (validateOnChange && validationRules[name]) {
      const error = validateValue(value, validationRules[name]);
      if (error) {
        dispatch({ type: 'SET_FIELD_ERROR', payload: { name, error } });
      } else {
        // Remove error if validation passes
        const newErrors = { ...state.errors };
        delete newErrors[name];
        dispatch({ type: 'SET_VALIDATION_STATE', payload: { errors: newErrors } });
      }
    }
  }, [validateOnChange, validationRules, state.errors]);

  const setFieldError = useCallback((name: string, error: string) => {
    dispatch({ type: 'SET_FIELD_ERROR', payload: { name, error } });
  }, []);

  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', payload: { name, touched } });
    
    if (touched && validateOnBlur && validationRules[name]) {
      const value = state.values?.[name];
      const error = validateValue(value, validationRules[name]);
      if (error) {
        dispatch({ type: 'SET_FIELD_ERROR', payload: { name, error } });
      }
    }
  }, [validateOnBlur, validationRules, state.values]);

  const validateField = useCallback((name: string): boolean => {
    if (!validationRules[name]) return true;
    
    const value = state.values?.[name];
    const error = validateValue(value, validationRules[name]);
    
    if (error) {
      dispatch({ type: 'SET_FIELD_ERROR', payload: { name, error } });
      return false;
    } else {
      // Remove error if validation passes
      const newErrors = { ...state.errors };
      delete newErrors[name];
      dispatch({ type: 'SET_VALIDATION_STATE', payload: { errors: newErrors } });
      return true;
    }
  }, [validationRules, state.values, state.errors]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    
    Object.keys(validationRules).forEach(name => {
      const value = state.values?.[name];
      const error = validateValue(value, validationRules[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });
    
    dispatch({ type: 'SET_VALIDATION_STATE', payload: { errors: newErrors, isValid } });
    return isValid;
  }, [validationRules, state.values]);

  const submitForm = useCallback(async () => {
    if (!onSubmit) return;
    
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    
    try {
      let isValid = true;
      if (validateOnSubmit) {
        isValid = validateForm();
      }
      
      if (isValid && state.values) {
        await onSubmit(state.values, {
          validation: state,
          setFieldValue,
          setFieldError,
          setFieldTouched,
          validateField,
          validateForm,
          submitForm,
          resetForm,
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [onSubmit, validateOnSubmit, validateForm, state, setFieldValue, setFieldError, setFieldTouched, validateField]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM', payload: initialValues });
  }, [initialValues]);

  // Update form state when initialValues change (if enableReinitialize is true)
  useEffect(() => {
    if (enableReinitialize) {
      dispatch({ type: 'RESET_FORM', payload: initialValues });
    }
  }, [initialValues, enableReinitialize]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const hasErrors = Object.keys(state.errors || {}).length > 0;
      onValidationChange(!hasErrors, state.errors || {});
    }
  }, [state.errors, onValidationChange]);

  const contextValue: FormContextProps = {
    validation: state,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    submitForm,
    resetForm,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} {...formProps}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

FormProvider.displayName = 'FormProvider';