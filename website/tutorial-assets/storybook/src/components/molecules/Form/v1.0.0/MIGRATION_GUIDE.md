# Form System Migration Guide

## Overview

The new Form System provides a comprehensive, accessible, and maintainable approach to form building. This guide shows how to migrate from existing form patterns to the new system.

## Core Components

- **Form**: Root form wrapper with state management
- **FormField**: Main field wrapper combining label, input, and validation
- **FormLabel**: Accessible labels with required indicators
- **FormHelperText**: Helper text, errors, success, and warning messages
- **FormGroup**: Groups related fields with fieldset semantics
- **FormProvider**: Context provider for form state management

## Migration Patterns

### Pattern 1: Simple Input Field

**Before (existing Input component):**
```tsx
<Input 
  label="Email Address"
  error="Invalid email"
  helperText="We'll never share your email"
  required
  type="email"
/>
```

**After (new Form System):**
```tsx
<FormField
  label="Email Address" 
  error="Invalid email"
  helperText="We'll never share your email"
  required
>
  <Input type="email" />
</FormField>
```

### Pattern 2: Form with Multiple Fields

**Before:**
```tsx
<form>
  <Input label="First Name" required />
  <Input label="Last Name" required />
  <Input label="Email" type="email" required />
  <Button type="submit">Submit</Button>
</form>
```

**After:**
```tsx
<Form 
  initialValues={{ firstName: '', lastName: '', email: '' }}
  onSubmit={(values) => console.log(values)}
>
  <FormField name="firstName" label="First Name" required>
    <Input />
  </FormField>
  
  <FormField name="lastName" label="Last Name" required>
    <Input />
  </FormField>
  
  <FormField name="email" label="Email" required>
    <Input type="email" />
  </FormField>
  
  <Button type="submit">Submit</Button>
</Form>
```

### Pattern 3: Grouped Form Fields

**Before:**
```tsx
<div>
  <h3>Personal Information</h3>
  <Input label="First Name" />
  <Input label="Last Name" />
</div>
<div>
  <h3>Contact Information</h3>
  <Input label="Email" />
  <Input label="Phone" />
</div>
```

**After:**
```tsx
<Form>
  <FormGroup 
    legend="Personal Information"
    description="Basic details about yourself"
  >
    <FormField name="firstName" label="First Name">
      <Input />
    </FormField>
    <FormField name="lastName" label="Last Name">
      <Input />
    </FormField>
  </FormGroup>
  
  <FormGroup 
    legend="Contact Information"
    description="How we can reach you"
  >
    <FormField name="email" label="Email">
      <Input type="email" />
    </FormField>
    <FormField name="phone" label="Phone">
      <Input type="tel" />
    </FormField>
  </FormGroup>
</Form>
```

### Pattern 4: Horizontal Layout Forms

**Before:**
```tsx
<div className="flex items-center gap-4">
  <label>Name:</label>
  <Input />
</div>
```

**After:**
```tsx
<FormField 
  layout="horizontal" 
  label="Name" 
  labelWidth="100px"
>
  <Input />
</FormField>
```

## Real-World Examples

### Login Form Migration

**Before:**
```tsx
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        required
      />
      <Input 
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit">Sign In</Button>
    </form>
  );
};
```

**After:**
```tsx
const LoginForm = () => {
  const [submitError, setSubmitError] = useState('');
  
  const handleSubmit = async (values) => {
    try {
      await loginUser(values);
    } catch (error) {
      setSubmitError('Invalid credentials');
    }
  };

  return (
    <Form 
      initialValues={{ email: '', password: '' }}
      onSubmit={handleSubmit}
    >
      <FormField name="email" label="Email" required>
        <Input type="email" />
      </FormField>
      
      <FormField name="password" label="Password" required>
        <Input type="password" />
      </FormField>
      
      {submitError && (
        <FormHelperText variant="error">
          {submitError}
        </FormHelperText>
      )}
      
      <Button type="submit">Sign In</Button>
    </Form>
  );
};
```

### Settings Form Migration

**Before:**
```tsx
const SettingsForm = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    theme: 'light',
    language: 'en'
  });

  return (
    <form>
      <h3>Notification Settings</h3>
      <Input 
        type="checkbox"
        label="Email Notifications"
        checked={settings.notifications}
        onChange={(e) => setSettings({
          ...settings, 
          notifications: e.target.checked
        })}
      />
      
      <h3>Appearance</h3>
      <Select 
        label="Theme"
        value={settings.theme}
        onChange={(value) => setSettings({
          ...settings,
          theme: value
        })}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
    </form>
  );
};
```

**After:**
```tsx
const SettingsForm = () => {
  const handleSubmit = async (values) => {
    await updateUserSettings(values);
    // Show success message
  };

  return (
    <Form 
      initialValues={{
        notifications: true,
        theme: 'light',
        language: 'en'
      }}
      onSubmit={handleSubmit}
    >
      <FormGroup 
        legend="Notification Settings"
        description="Configure how you receive updates"
      >
        <FormField name="notifications" label="Email Notifications">
          <Input type="checkbox" />
        </FormField>
      </FormGroup>
      
      <FormGroup 
        legend="Appearance"
        description="Customize how the app looks"
      >
        <FormField name="theme" label="Theme">
          <Select>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </FormField>
      </FormGroup>
      
      <Button type="submit">Save Settings</Button>
    </Form>
  );
};
```

## Key Benefits of Migration

### 1. Improved Accessibility
- Automatic ARIA attributes and relationships
- Screen reader support with clear field associations
- Proper focus management and keyboard navigation
- Semantic HTML structure with fieldsets and legends

### 2. Consistent Validation UX
- Unified error state handling
- Success and warning message support
- Real-time validation feedback
- Form-level validation context

### 3. Better Developer Experience
- Less boilerplate code for common patterns
- TypeScript support with comprehensive types
- Flexible layout options (vertical/horizontal)
- Centralized form state management

### 4. Enhanced Maintainability
- Separation of concerns (data, validation, presentation)
- Reusable form patterns
- Consistent styling and behavior
- Easy to extend and customize

## Migration Checklist

- [ ] Replace standalone Input components with FormField + Input
- [ ] Add FormProvider/Form wrapper for state management
- [ ] Group related fields with FormGroup components
- [ ] Update validation logic to use form context
- [ ] Test accessibility with screen readers
- [ ] Update tests to use new component structure
- [ ] Review and update form styling if needed

## Breaking Changes

1. **Input Component**: The existing Input component's built-in label, error, and helper text props are now handled by FormField
2. **Form State**: Manual state management should be replaced with Form context
3. **Validation**: Custom validation logic should integrate with FormProvider
4. **Layout**: Manual form layouts should use FormField layout props

## Gradual Migration Strategy

1. **Phase 1**: Start with new forms using the Form System
2. **Phase 2**: Migrate simple forms (login, contact) 
3. **Phase 3**: Migrate complex forms (settings, multi-step)
4. **Phase 4**: Update existing Input usage to FormField where beneficial

The Form System is designed to be incrementally adoptable - you can use FormField as a wrapper around existing Input components without changing the underlying logic.