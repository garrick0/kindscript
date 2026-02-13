# [ComponentName]

Brief description of what this component does.

## Usage

```tsx
import { ComponentName } from '@induction/storybook';

<ComponentName prop1="value" onAction={handleAction} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `prop1` | `string` | Yes | Description |
| `prop2` | `boolean` | No | Description |
| `onAction` | `() => void` | No | Description |

## Examples

```tsx
// Basic
<ComponentName prop1="Hello" />

// With callback
<ComponentName 
  prop1="Hello"
  onAction={() => console.log('Clicked')}
/>
```

## Files

- `ComponentName.tsx` - Main component
- `useComponentName.ts` - Business logic (if complex)
- `ComponentName.stories.tsx` - Storybook stories
- `ComponentName.test.tsx` - Tests