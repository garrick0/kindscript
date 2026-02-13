# ModuleTypeEditorPage v1.0.0

Independent page component for creating, editing, and managing module type definitions with comprehensive CRUD operations, validation, and testing capabilities.

## Overview

The ModuleTypeEditorPage provides a complete interface for module type management, following the established Pages structure pattern with proper separation of concerns across UI, domain, and data layers.

## Features

- **Module Type CRUD Operations**: Create, read, update, and delete module type definitions
- **Discovery Pattern Configuration**: Define and test patterns for module discovery with live preview
- **Structure Requirements Management**: Specify required/optional folders and files with validation schemas
- **Assertion Configuration**: Set up ESLint rules, test coverage requirements, and custom validations
- **Real-time Validation**: Immediate feedback on configuration errors and warnings
- **Import/Export**: JSON-based module type sharing and backup
- **Search & Filtering**: Find module types quickly with text search
- **Pages Structure Presets**: One-click application of common patterns like the Pages structure
- **Responsive Design**: Fully responsive interface that works on all screen sizes
- **Dark Mode Support**: Complete dark mode implementation

## Usage

### Basic Usage

```tsx
import { ModuleTypeEditorPage } from '@induction/storybook';

export default function ModuleTypes() {
  return <ModuleTypeEditorPage />;
}
```

### With Initial Module Type

```tsx
import { ModuleTypeEditorPage } from '@induction/storybook';

export default function EditModuleType() {
  return (
    <ModuleTypeEditorPage 
      initialModuleTypeId="page-component-v1"
    />
  );
}
```

### Platform Integration

```tsx
// apps/platform/src/app/(platform)/module-types/page.tsx
import { ModuleTypeEditorPage } from '@induction/storybook';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Module Types | Induction Studio'
};

export default function ModuleTypesPage() {
  return (
    <ModuleTypeEditorPage 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    />
  );
}
```

## Architecture

### Directory Structure

```
ModuleTypeEditorPage/v1.0.0/
├── ui/                           # User interface layer
│   ├── ModuleTypeEditorPage.tsx  # Main page component
│   └── ModuleTypeEditorPage.stories.tsx # Storybook documentation
├── domain/                       # Business logic layer
│   └── useModuleTypeEditor.ts    # Main hook for state management
├── data/                         # Data access layer
│   └── module-type-editor.service.ts # API service class
├── types/                        # Type definitions
│   └── module-type-editor.types.ts # TypeScript interfaces
├── validation/                   # Input validation
│   └── module-type-editor.validation.ts # Zod schemas
├── metadata.json                 # Page metadata
├── dependencies.json            # Dependencies specification
└── README.md                   # This documentation
```

### Data Flow

1. **UI Layer** (`ModuleTypeEditorPage.tsx`) handles user interactions and rendering
2. **Domain Layer** (`useModuleTypeEditor.ts`) manages business logic and state
3. **Data Layer** (`module-type-editor.service.ts`) handles data persistence and API calls
4. **Types** provide TypeScript safety across all layers
5. **Validation** ensures data integrity with Zod schemas

### State Management

The page uses the `useModuleTypeEditor` hook for centralized state management:

```tsx
const {
  // State
  mode,           // 'list' | 'create' | 'edit' | 'view'
  activeTab,      // Current configuration tab
  formData,       // Form state
  moduleTypes,    // All module types
  loading,        // Loading state
  error,          // Error state
  
  // Actions
  setMode,
  saveModuleType,
  deleteModuleType,
  testDiscoveryPatterns,
  // ... other actions
} = useModuleTypeEditor();
```

## Configuration Tabs

### 1. Basic Info
- Module type name, version, description
- Author information and documentation URLs
- Tags for categorization

### 2. Discovery Patterns
- Base pattern for module location
- Instance pattern for version identification
- File pattern requirements (required, optional, forbidden)
- Live pattern testing with preview

### 3. Structure Requirements
- Folder structure specification (required/optional)
- File requirements with validation schemas
- Pages structure preset button
- Visual structure preview

### 4. Assertions
- ESLint rule configuration
- Test coverage requirements
- Custom validation rules
- Assertion presets (React, TypeScript, etc.)

### 5. Templates *(Coming Soon)*
- Module generation templates
- Variable substitution
- Template validation

### 6. Validation
- Real-time configuration validation
- Discovery pattern testing
- Assertion execution testing
- Overall health summary

## API Integration

The page integrates with several API endpoints:

- `GET /api/module-types` - Fetch all module types
- `POST /api/module-types` - Create new module type
- `PUT /api/module-types/:id` - Update existing module type
- `DELETE /api/module-types/:id` - Delete module type
- `POST /api/module-types/test-discovery` - Test discovery patterns
- `POST /api/module-types/test-assertions` - Test assertion rules

## Testing

### Unit Tests
- Hook testing: `useModuleTypeEditor.test.ts`
- Service testing: `module-type-editor.service.test.ts`

### Integration Tests
- Page testing: `ModuleTypeEditorPage.test.tsx`
- User workflow testing

### Storybook Stories
- Default states
- Create/edit workflows
- Validation scenarios
- Mobile responsive views

### E2E Tests
- Complete CRUD workflows
- Discovery pattern testing
- Import/export functionality

## Performance Considerations

- **Lazy Loading**: Large configuration sections load on demand
- **Debounced Validation**: Form validation debounced to avoid excessive calls
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Discovery Caching**: Pattern test results cached for performance

## Accessibility

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: WCAG AA compliant color schemes
- **Focus Management**: Logical focus order and visual indicators

## Browser Support

- Chrome >= 90
- Firefox >= 90
- Safari >= 14
- Edge >= 90

## Migration from Embedded Version

If migrating from the embedded ModuleTypeEditor component:

1. Update imports:
   ```tsx
   // Old
   import { ModuleTypeEditor } from './ModuleTypeEditor';
   
   // New
   import { ModuleTypeEditorPage } from '@induction/storybook';
   ```

2. Remove tab integration and use as standalone page
3. Update routing to point to the new page
4. Update any direct component references

## Contributing

When contributing to this page:

1. Follow the Pages structure pattern
2. Keep UI, domain, and data layers separate
3. Add tests for new functionality
4. Update Storybook stories
5. Maintain TypeScript safety
6. Follow accessibility guidelines

## Version History

### v1.0.0 (2025-08-25)
- Initial release
- Complete CRUD operations
- Discovery pattern configuration
- Structure requirements management
- Basic assertion configuration
- Import/export functionality
- Responsive design
- Dark mode support