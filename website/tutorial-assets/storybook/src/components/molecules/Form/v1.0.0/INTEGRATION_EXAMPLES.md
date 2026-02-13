# Form System Integration Examples

This document provides real-world examples of integrating the Form System with the existing application architecture.

## Example 1: Settings Page Integration

Replace existing form patterns in the Settings page with the new Form System:

### Before (Current Pattern)
```tsx
// Existing settings form pattern
import { Input, Button } from '@induction/storybook/components';

const SettingsForm = () => {
  const [settings, setSettings] = useState({
    email: '',
    notifications: true,
    theme: 'light'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Email"
        value={settings.email}
        onChange={(e) => setSettings({...settings, email: e.target.value})}
        required
      />
      <Input 
        type="checkbox"
        label="Email Notifications"
        checked={settings.notifications}
        onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
      />
      <Button type="submit">Save Settings</Button>
    </form>
  );
};
```

### After (New Form System)
```tsx
// Using the new Form System
import { 
  Form, 
  FormField, 
  FormGroup, 
  Input, 
  Button 
} from '@induction/storybook/components';

const SettingsForm = () => {
  const handleSubmit = async (values) => {
    try {
      await updateUserSettings(values);
      // Show success toast
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Form
      initialValues={{
        email: '',
        notifications: true,
        theme: 'light'
      }}
      onSubmit={handleSubmit}
      validateOnBlur
    >
      <FormGroup 
        legend="Account Settings"
        description="Manage your account preferences"
      >
        <FormField name="email" label="Email Address" required>
          <Input type="email" />
        </FormField>
        
        <FormField name="notifications" label="Email Notifications">
          <Input type="checkbox" />
        </FormField>
      </FormGroup>
      
      <Button type="submit">Save Settings</Button>
    </Form>
  );
};
```

## Example 2: Login Form Integration

### Before (Current Pattern)
```tsx
import { Input, Button } from '@induction/storybook/components';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Email"
        type="email"
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
      <Button type="submit" loading={loading}>
        Sign In
      </Button>
    </form>
  );
};
```

### After (New Form System)
```tsx
import { 
  Form, 
  FormField, 
  FormHelperText,
  Input, 
  Button 
} from '@induction/storybook/components';

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setLoginError('');
    
    try {
      await login(values.email, values.password);
    } catch (err) {
      setLoginError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      initialValues={{ email: '', password: '' }}
      onSubmit={handleSubmit}
      validateOnSubmit
    >
      <FormField name="email" label="Email Address" required>
        <Input type="email" disabled={isLoading} />
      </FormField>
      
      <FormField name="password" label="Password" required>
        <Input type="password" disabled={isLoading} />
      </FormField>
      
      {loginError && (
        <FormHelperText variant="error">
          {loginError}
        </FormHelperText>
      )}
      
      <Button type="submit" loading={isLoading}>
        Sign In
      </Button>
    </Form>
  );
};
```

## Example 3: User Profile Form

### Complex Multi-Section Form
```tsx
import { 
  Form, 
  FormField, 
  FormGroup, 
  Input, 
  Select,
  Button 
} from '@induction/storybook/components';

const UserProfileForm = ({ user }) => {
  const handleSubmit = async (values) => {
    const { personalInfo, contactInfo, preferences } = values;
    
    try {
      await Promise.all([
        updatePersonalInfo(personalInfo),
        updateContactInfo(contactInfo),
        updatePreferences(preferences)
      ]);
      
      // Show success message
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Form
      initialValues={{
        personalInfo: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          bio: user.bio || ''
        },
        contactInfo: {
          email: user.email || '',
          phone: user.phone || ''
        },
        preferences: {
          theme: user.theme || 'light',
          language: user.language || 'en',
          notifications: user.notifications || true
        }
      }}
      onSubmit={handleSubmit}
      validateOnChange
      validateOnBlur
    >
      <FormGroup 
        legend="Personal Information"
        description="Your basic profile details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            name="personalInfo.firstName" 
            label="First Name" 
            required
          >
            <Input />
          </FormField>
          
          <FormField 
            name="personalInfo.lastName" 
            label="Last Name" 
            required
          >
            <Input />
          </FormField>
        </div>
        
        <FormField 
          name="personalInfo.bio" 
          label="Bio"
          helperText="Tell us about yourself (optional)"
        >
          <Input />
        </FormField>
      </FormGroup>
      
      <FormGroup 
        legend="Contact Information"
        description="How we can reach you"
      >
        <FormField 
          name="contactInfo.email" 
          label="Email Address" 
          required
        >
          <Input type="email" />
        </FormField>
        
        <FormField 
          name="contactInfo.phone" 
          label="Phone Number"
          helperText="For account recovery (optional)"
        >
          <Input type="tel" />
        </FormField>
      </FormGroup>
      
      <FormGroup 
        legend="Preferences"
        description="Customize your experience"
      >
        <FormField name="preferences.theme" label="Theme">
          <Select>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </Select>
        </FormField>
        
        <FormField name="preferences.language" label="Language">
          <Select>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </Select>
        </FormField>
        
        <FormField name="preferences.notifications" label="Email Notifications">
          <Input type="checkbox" />
        </FormField>
      </FormGroup>
      
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
```

## Example 4: Data Upload Form

### With File Upload and Validation
```tsx
import { 
  Form, 
  FormField, 
  FormGroup,
  FormHelperText,
  Input, 
  Select,
  Button 
} from '@induction/storybook/components';

const DataUploadForm = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file) => {
    if (!file) return 'File is required';
    if (file.size > 10 * 1024 * 1024) return 'File must be less than 10MB';
    if (!['text/csv', 'application/json'].includes(file.type)) {
      return 'Only CSV and JSON files are supported';
    }
    return undefined;
  };

  const handleSubmit = async (values) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', values.file);
      formData.append('dataset_name', values.datasetName);
      formData.append('description', values.description);
      
      await uploadDataset(formData, {
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.loaded / progress.total * 100));
        }
      });
      
      // Show success and redirect
      toast.success('Dataset uploaded successfully');
      router.push('/datasets');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Form
      initialValues={{
        file: null,
        datasetName: '',
        description: '',
        visibility: 'private'
      }}
      onSubmit={handleSubmit}
      validateOnSubmit
    >
      <FormGroup 
        legend="Dataset Upload"
        description="Upload and configure your dataset"
      >
        <FormField 
          name="file" 
          label="Data File" 
          required
          helperText="Supported formats: CSV, JSON (max 10MB)"
        >
          <Input type="file" accept=".csv,.json" />
        </FormField>
        
        <FormField 
          name="datasetName" 
          label="Dataset Name" 
          required
          helperText="A descriptive name for your dataset"
        >
          <Input placeholder="My Dataset" />
        </FormField>
        
        <FormField 
          name="description" 
          label="Description"
          helperText="What does this dataset contain?"
        >
          <Input placeholder="Describe your data..." />
        </FormField>
        
        <FormField name="visibility" label="Visibility">
          <Select>
            <option value="private">Private</option>
            <option value="team">Team Only</option>
            <option value="public">Public</option>
          </Select>
        </FormField>
      </FormGroup>
      
      {isUploading && (
        <div className="space-y-2">
          <FormHelperText>
            Uploading... {uploadProgress}%
          </FormHelperText>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" loading={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Dataset'}
        </Button>
      </div>
    </Form>
  );
};
```

## Integration Benefits

### 1. Reduced Boilerplate
- **Before**: ~50 lines for a simple login form
- **After**: ~25 lines with better functionality

### 2. Improved Accessibility
- Automatic ARIA attributes and relationships
- Screen reader support out of the box
- Proper keyboard navigation

### 3. Better Error Handling
- Centralized validation state
- Consistent error message display
- Real-time validation feedback

### 4. Enhanced Developer Experience
- TypeScript support with full type safety
- Consistent API across all form patterns
- Easy to test and maintain

## Migration Strategy

1. **Start with new forms** - Use Form System for all new form implementations
2. **Migrate simple forms first** - Login, contact forms, etc.
3. **Update complex forms gradually** - Settings, profile, data upload forms
4. **Maintain backward compatibility** - Old forms can coexist during migration

## Testing Integration

```tsx
import { render, screen, userEvent } from '@testing-library/react';
import { Form, FormField, Input, Button } from '@induction/storybook/components';

describe('Form Integration', () => {
  it('handles form submission correctly', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(
      <Form onSubmit={onSubmit} initialValues={{ email: '' }}>
        <FormField name="email" label="Email" required>
          <Input type="email" />
        </FormField>
        <Button type="submit">Submit</Button>
      </Form>
    );
    
    await user.type(screen.getByLabelText('Email *'), 'test@example.com');
    await user.click(screen.getByText('Submit'));
    
    expect(onSubmit).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      expect.any(Object)
    );
  });
  
  it('displays validation errors', async () => {
    render(
      <FormField 
        name="email" 
        label="Email" 
        error="Invalid email format"
      >
        <Input type="email" />
      </FormField>
    );
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
```

This integration approach ensures a smooth transition while providing immediate benefits for new development and a clear path for migrating existing forms.