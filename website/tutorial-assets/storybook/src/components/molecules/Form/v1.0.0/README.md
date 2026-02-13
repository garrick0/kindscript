# Form System v1.0.0

A comprehensive, accessible, and maintainable form system built on atomic design principles.

## Overview

The Form System provides everything needed to build robust forms with proper validation, accessibility, and user experience. It's designed to work seamlessly with existing components while providing enhanced capabilities for complex form scenarios.

## Architecture

```
Form System
├── Form               # Root wrapper with state management
├── FormProvider       # Context provider for form state
├── FormField          # Main field wrapper (label + input + validation)
├── FormLabel          # Accessible labels with required indicators
├── FormHelperText     # Helper text, errors, success messages
└── FormGroup          # Groups related fields with fieldset semantics
```

## Quick Start

### Basic Form Field

```tsx
import { FormField, Input } from '@induction/storybook/components';

<FormField
  label="Email Address"
  required
  helperText="We'll never share your email"
>
  <Input type="email" />
</FormField>
```

### Form with State Management

```tsx
import { Form, FormField, Input, Button } from '@induction/storybook/components';

<Form
  initialValues={{ email: '', password: '' }}
  onSubmit={(values) => console.log(values)}
>
  <FormField name="email" label="Email" required>
    <Input type="email" />
  </FormField>
  
  <FormField name="password" label="Password" required>
    <Input type="password" />
  </FormField>
  
  <Button type="submit">Submit</Button>
</Form>
```

### Grouped Form Fields

```tsx
import { Form, FormGroup, FormField, Input } from '@induction/storybook/components';

<Form>
  <FormGroup 
    legend="Personal Information"
    description="Basic details about yourself"
  >
    <FormField name="firstName" label="First Name" required>
      <Input />
    </FormField>
    
    <FormField name="lastName" label="Last Name" required>
      <Input />
    </FormField>
  </FormGroup>
</Form>
```

## Component API

### FormField

The main wrapper component that combines label, input, and validation.

```tsx
interface FormFieldProps {
  children: React.ReactNode;           // Input, Select, Textarea, etc.
  
  // Labeling
  label?: string | React.ReactNode;    // Field label
  labelProps?: FormLabelProps;         // Additional label props
  required?: boolean;                  // Show required indicator
  
  // Help and validation
  helperText?: string | React.ReactNode;  // Helper text
  error?: string | React.ReactNode;       // Error message
  success?: string | React.ReactNode;     // Success message  
  warning?: string | React.ReactNode;     // Warning message
  
  // Layout
  layout?: 'vertical' | 'horizontal';     // Field layout
  labelWidth?: string | number;           // Label width (horizontal)
  
  // Form integration
  name?: string;                          // Field name for context
  
  // Accessibility
  describedBy?: string;                   // Additional ARIA description
  disabled?: boolean;                     // Disable entire field
  id?: string;                           // Custom field ID
  className?: string;                     // Additional CSS classes
}
```

### Form / FormProvider

Root form wrapper with state management and validation.

```tsx
interface FormProps {
  children: React.ReactNode;
  initialValues?: Record<string, any>;        // Initial form values
  onSubmit?: (values, actions) => void;       // Submit handler
  onValidationChange?: (isValid, errors) => void;  // Validation callback
  validateOnChange?: boolean;                 // Validate on field change
  validateOnBlur?: boolean;                   // Validate on field blur
  validateOnSubmit?: boolean;                 // Validate on form submit
  enableReinitialize?: boolean;               // Re-init when initialValues change
}
```

### FormGroup

Groups related form fields with semantic structure.

```tsx
interface FormGroupProps {
  children: React.ReactNode;
  legend?: string;                      // Group legend/title
  description?: string;                 // Group description
  error?: string | boolean;             // Group-level error
  orientation?: 'vertical' | 'horizontal';  // Layout orientation
  spacing?: 'sm' | 'default' | 'lg';   // Internal spacing
  disabled?: boolean;                   // Disable entire group
  className?: string;                   // Additional CSS classes
}
```

### FormLabel

Accessible labels with required indicators and flexible styling.

```tsx
interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;                     // Target input ID
  required?: boolean;                   // Show required indicator
  size?: 'sm' | 'default' | 'lg';     // Label size
  weight?: 'normal' | 'medium' | 'semibold';  // Font weight
  disabled?: boolean;                   // Disabled state
  className?: string;                   // Additional CSS classes
}
```

### FormHelperText

Helper text, error, success, and warning messages.

```tsx
interface FormHelperTextProps {
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'success' | 'warning';  // Message type
  size?: 'sm' | 'default';             // Text size
  disabled?: boolean;                   // Disabled state
  className?: string;                   // Additional CSS classes
}
```

## Advanced Usage

### Custom Validation

```tsx
const validateEmail = (value) => {
  if (!value) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
  return undefined;
};

<Form
  initialValues={{ email: '' }}
  onSubmit={(values) => {
    // Handle submission
  }}
>
  <FormField 
    name="email" 
    label="Email"
    required
  >
    <Input type="email" />
  </FormField>
</Form>
```

### Horizontal Layout

```tsx
<FormField
  layout="horizontal"
  label="Full Name"
  labelWidth="120px"
  helperText="Enter your complete name"
>
  <Input placeholder="John Doe" />
</FormField>
```

### Controlled vs Uncontrolled

```tsx
// Uncontrolled (form manages state)
<Form initialValues={{ name: '' }}>
  <FormField name="name" label="Name">
    <Input />
  </FormField>
</Form>

// Controlled (you manage state)
const [name, setName] = useState('');

<FormField 
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
>
  <Input />
</FormField>
```

### Integration with Existing Components

The Form System is designed to work with any input component:

```tsx
<FormField label="Description">
  <Textarea rows={4} />
</FormField>

<FormField label="Category">
  <Select>
    <option value="tech">Technology</option>
    <option value="design">Design</option>
  </Select>
</FormField>

<FormField label="Subscribe to newsletter">
  <Checkbox />
</FormField>
```

## Accessibility Features

- **ARIA Relationships**: Automatic `aria-labelledby`, `aria-describedby`, and `aria-invalid` attributes
- **Screen Reader Support**: Proper associations between labels, inputs, and help text
- **Keyboard Navigation**: Full keyboard accessibility with logical tab order
- **Semantic HTML**: Uses `<fieldset>` and `<legend>` for form groups
- **Error Announcements**: Error messages have `role="alert"` for immediate announcement
- **Required Indicators**: Clear visual and programmatic indication of required fields

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import type { 
  FormProps, 
  FormFieldProps, 
  FormValidationState,
  ValidationRule 
} from '@induction/storybook/components';
```

## Testing

The Form System includes comprehensive test coverage and testing utilities:

```tsx
import { render, screen, userEvent } from '@testing-library/react';
import { Form, FormField, Input } from '@induction/storybook/components';

test('form submission works correctly', async () => {
  const onSubmit = jest.fn();
  
  render(
    <Form onSubmit={onSubmit}>
      <FormField name="email" label="Email">
        <Input type="email" />
      </FormField>
      <button type="submit">Submit</button>
    </Form>
  );
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByText('Submit'));
  
  expect(onSubmit).toHaveBeenCalledWith(
    { email: 'test@example.com' },
    expect.any(Object)
  );
});
```

## Best Practices

1. **Use FormField for all form inputs** - Provides consistent labeling and validation
2. **Group related fields** - Use FormGroup for logical field groupings  
3. **Provide helpful error messages** - Clear, actionable error messages
4. **Use appropriate input types** - Email, tel, url, etc. for better UX
5. **Test with screen readers** - Ensure accessibility for all users
6. **Validate early and often** - Real-time validation for better UX
7. **Keep forms simple** - Break complex forms into steps when possible

## Examples

See the Storybook documentation for comprehensive examples:

- Basic form fields with all states
- Complex multi-section forms
- Real-world login and registration forms  
- Settings and configuration forms
- Horizontal and vertical layouts
- Integration with validation libraries

## Migration

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions from existing form patterns.