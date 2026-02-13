# Storybook Public Assets

This directory contains static assets used by UI components in Storybook.

## Directory Structure

```
public/
└── assets/
    ├── icons/      # SVG icons used by components
    ├── images/     # Images used by components
    └── README.md   # This file
```

## Usage

Components can reference these assets using absolute paths:

```tsx
// In a component
<img src="/assets/icons/logo.svg" alt="Logo" />
<img src="/assets/images/hero.png" alt="Hero" />
```

## Guidelines

1. **Component Assets Only**: Only assets used by UI components belong here
2. **Organized by Type**: Keep icons and images in separate folders
3. **Meaningful Names**: Use descriptive, kebab-case filenames
4. **Optimize Assets**: Compress images and minify SVGs before adding
5. **No Platform Assets**: Deployment-specific assets (favicon, etc.) stay in platform/public

## Migration from Platform

When moving assets from platform to Storybook:
1. Place the asset in the appropriate subfolder here
2. Update component imports to use `/assets/...` path
3. Test in both Storybook and platform environments