# [ComponentName]

## Overview
Brief description of what this component does and when to use it.

## Usage

```tsx
import { ComponentName } from '@induction/storybook/components/[category]/ComponentName';

function Example() {
  return (
    <ComponentName
      prop1="value"
      prop2={true}
      onAction={handleAction}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prop1` | `string` | - | Description of prop1 |
| `prop2` | `boolean` | `false` | Description of prop2 |
| `onAction` | `() => void` | - | Callback when action occurs |

## Features

- ✅ Feature 1
- ✅ Feature 2
- ✅ Feature 3

## Variants

### Default
The standard implementation.

### Compact
A space-saving variant for dense UIs.

### Detailed
Shows additional information and controls.

## Component Structure

This component follows the Frontend Container Pattern:

```
ComponentName/
├── index.ts                 # Public exports
├── ComponentName.tsx        # Main component
├── ComponentName.stories.tsx # Storybook stories
├── ComponentName.test.tsx   # Unit tests
├── useComponentName.ts      # Component hook (business logic)
├── component.service.ts     # API service (if needed)
├── component.types.ts       # TypeScript types
└── component.validation.ts  # Validation schemas (if needed)
```

## Dependencies

### Internal
- `@induction/auth` - For authentication
- `../SharedComponent` - Shared functionality

### External
- `react` - Core React
- `lucide-react` - Icons
- Additional packages...

## Testing

```bash
# Run tests
pnpm test ComponentName

# Run in watch mode
pnpm test:watch ComponentName

# View in Storybook
pnpm storybook
# Navigate to: Components > [Category] > ComponentName
```

## Accessibility

- ✅ WCAG 2.1 Level AA compliant
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ ARIA labels and roles

## Performance

- Renders in < 50ms
- Memoized expensive computations
- Lazy loads heavy dependencies
- Virtualized for large datasets (if applicable)

## Migration Guide

### From v1 to v2
```tsx
// Before (v1)
<OldComponent items={data} />

// After (v2)
<ComponentName data={data} variant="default" />
```

## Examples

### Basic Usage
```tsx
<ComponentName data={items} />
```

### With Event Handlers
```tsx
<ComponentName 
  data={items}
  onSelect={(item) => console.log('Selected:', item)}
  onDelete={(id) => handleDelete(id)}
/>
```

### Custom Styling
```tsx
<ComponentName 
  data={items}
  className="custom-class"
  style={{ maxHeight: '400px' }}
/>
```

## API Reference

### Hooks

#### `useComponentName(options)`
Main hook for component logic.

**Parameters:**
- `options.userId` - User ID for data filtering
- `options.filters` - Initial filter state

**Returns:**
- `data` - The component data
- `loading` - Loading state
- `error` - Error state
- `actions` - Available actions

### Services

#### `ComponentService`
Service class for API interactions.

**Methods:**
- `getAll()` - Fetch all items
- `getById(id)` - Fetch single item
- `create(data)` - Create new item
- `update(id, data)` - Update existing item
- `delete(id)` - Delete item

## Troubleshooting

### Common Issues

**Issue:** Component not rendering
**Solution:** Check that required props are provided

**Issue:** Data not loading
**Solution:** Verify service is properly injected via ServiceProvider

**Issue:** Types not working
**Solution:** Ensure TypeScript version is 5.0+

## Contributing

1. Follow the Frontend Container Pattern
2. Colocate all related files
3. Write tests for new features
4. Update this README
5. Add Storybook stories

## Related

- [ParentComponent](../ParentComponent/README.md) - Often used together
- [ChildComponent](../ChildComponent/README.md) - Can be nested inside
- [Design System Docs](../../README.md) - Overall patterns

## Changelog

### [Current Version]
- Current features and state

### v2.0.0 (2025-01-15)
- Breaking: Changed prop names
- Added: New variant support
- Fixed: Performance issues

### v1.0.0 (2024-12-01)
- Initial release