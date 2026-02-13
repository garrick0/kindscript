# Chromatic Visual Testing Setup

*Date: 2025-01-20*
*Status: ✅ Fully Configured*

## 🎯 Overview

Chromatic visual regression testing has been successfully integrated with the Storybook testing infrastructure. This setup captures visual snapshots of components and automatically detects changes across different screen sizes and scenarios.

## 🏗 Architecture

```
Storybook Stories
        ↓
Chromatic Helpers (skipPlayInChromatic)
        ↓
Visual Snapshots (Multiple Viewports)
        ↓
CI/CD Integration (GitHub Actions)
        ↓
Automated PR Comments
```

## 📁 Configuration Files

```
apps/storybook/
├── chromatic.config.json        # Chromatic configuration
├── .storybook/
│   ├── preview.tsx             # MSW + Chromatic decorators
│   ├── utils/
│   │   └── chromatic-helpers.ts # Helper functions
│   └── decorators/
│       └── chromatic-decorator.tsx # Error handling
├── scripts/
│   └── wrap-play-functions.js  # Automation script
└── package.json                # Dependencies and scripts

.github/workflows/
└── chromatic.yml               # CI/CD workflow
```

## 🚀 Quick Start

### 1. Local Development
```bash
# Build Storybook and run Chromatic locally
pnpm run visual-test

# Or run steps separately
pnpm run build-storybook
pnpm run chromatic
```

### 2. CI/CD Integration
The GitHub Actions workflow automatically:
- Runs on PRs affecting design system components
- Checks for unwrapped play functions
- Captures visual snapshots across multiple viewports
- Comments on PRs with results

### 3. Setting Up Project Token
```bash
# Get token from Chromatic dashboard
export CHROMATIC_PROJECT_TOKEN="your-token"

# For GitHub Actions, add to repository secrets:
# CHROMATIC_PROJECT_TOKEN
```

## 🎨 Visual Testing Configuration

### Viewport Testing
Chromatic captures screenshots at multiple screen sizes:
- **Mobile**: 375×667 (iPhone SE)
- **Tablet**: 768×1024 (iPad)
- **Desktop**: 1440×900 (Standard laptop)
- **Large Desktop**: 1920×1080 (Full HD)

### Capture Settings
```json
{
  "delay": 300,           // Wait 300ms before screenshot
  "animationTimeout": 1500, // Pause animations after 1.5s
  "threshold": 0.2        // 20% difference threshold
}
```

## 🛠 Chromatic Helpers

### skipPlayInChromatic
Prevents play functions from running in Chromatic to avoid timing issues:

```typescript
import { skipPlayInChromatic } from '../../../../../../apps/storybook/.storybook/utils/chromatic-helpers';

export const MyStory: Story = {
  play: skipPlayInChromatic(async ({ canvasElement }) => {
    // This only runs in local Storybook, not in Chromatic
    const canvas = within(canvasElement);
    // ... interactions
  })
};
```

### Other Available Helpers

```typescript
// Safe wrapper that catches errors in Chromatic
play: safePlayInChromatic(async ({ canvasElement }) => {
  // Errors are logged but don't fail the visual test
})

// Add delay for DOM stabilization
play: delayPlayInChromatic(async ({ canvasElement }) => {
  // Extra 500ms delay in Chromatic only
}, 500)

// Disable animations for consistent snapshots
play: withAnimation(async ({ canvasElement }) => {
  // Animations disabled in Chromatic
})

// Test different viewport sizes
export const ResponsiveStory = {
  ...withViewports(['mobile', 'tablet', 'desktop'])
};

// Test theme variants
export const ThemedStory = {
  ...withThemeVariants(['light', 'dark'])
};
```

## ✅ Play Function Best Practices

### ❌ Before (Will Cause Chromatic Errors)
```typescript
export const InteractiveStory: Story = {
  play: async ({ canvasElement }) => {
    // This causes timing issues in Chromatic
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  }
};
```

### ✅ After (Chromatic-Safe)
```typescript
import { skipPlayInChromatic } from '../../../../../../apps/storybook/.storybook/utils/chromatic-helpers';

export const InteractiveStory: Story = {
  play: skipPlayInChromatic(async ({ canvasElement }) => {
    // Only runs in local development
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  })
};
```

## 🔍 GitHub Actions Workflow

### Automatic Checks
1. **Play Function Validation**
   - Counts total play functions vs wrapped functions
   - Warns if unwrapped functions exist
   - Provides guidance in PR comments

2. **Visual Testing**
   - Only runs on changes to Storybook or design system
   - Builds design system and generates MSW handlers
   - Captures screenshots across all configured viewports
   - Uploads results to Chromatic dashboard

### Workflow Triggers
```yaml
on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'apps/storybook/**'
      - 'packages/design-system/**'
      - '.github/workflows/chromatic.yml'
```

## 📊 Visual Testing Workflow

### 1. Component Development
```bash
# Develop component with stories
apps/storybook/$ pnpm run dev

# Check visual appearance locally
# Write play functions for interactions
```

### 2. Chromatic Preparation
```bash
# Wrap play functions (if not done automatically)
apps/storybook/$ node scripts/wrap-play-functions.js

# Test visual snapshots locally
apps/storybook/$ pnpm run visual-test
```

### 3. Pull Request Process
```bash
# Create PR - triggers visual testing automatically
# Check GitHub Actions for play function report
# Review Chromatic dashboard for visual changes
# Approve or reject visual changes in Chromatic
```

### 4. Baseline Management
- **New components**: First Chromatic run creates baseline
- **Approved changes**: Accept changes in Chromatic dashboard
- **False positives**: Mark as approved without updating baseline

## 🎛 Story Configuration Options

### Ignore Stories in Chromatic
```typescript
export const DebugStory: Story = {
  parameters: {
    chromatic: { disableSnapshot: true }
  }
};
```

### Custom Delay for Specific Stories
```typescript
export const SlowStory: Story = {
  parameters: {
    chromatic: { delay: 1000 }
  }
};
```

### Multiple Viewport Testing
```typescript
export const ResponsiveComponent: Story = {
  parameters: {
    chromatic: {
      viewports: ['mobile', 'tablet', 'desktop']
    }
  }
};
```

## 🐛 Troubleshooting

### Play Functions Not Wrapped
**Symptoms**: CI check fails with unwrapped play functions
**Solution**: 
```bash
# Automatically wrap all play functions
node scripts/wrap-play-functions.js

# Or manually add skipPlayInChromatic wrapper
```

### Visual Changes Not Detected
**Symptoms**: Changes aren't showing in Chromatic
**Solution**:
1. Ensure component actually changed
2. Check if story is disabled (`chromatic: { disableSnapshot: true }`)
3. Verify Chromatic is receiving the build

### Animation Timing Issues
**Symptoms**: Inconsistent snapshots due to animations
**Solution**:
```typescript
// Disable animations in Chromatic
play: withAnimation(async ({ canvasElement }) => {
  // Your interactions here
})
```

### Memory Issues in CI
**Symptoms**: CI fails with out of memory errors
**Solution**: Already configured with `NODE_OPTIONS: --max_old_space_size=4096`

## 📈 Monitoring & Analytics

### Chromatic Dashboard
- **Build History**: Track visual changes over time
- **Story Coverage**: Ensure all stories are tested
- **Performance**: Monitor build times and sizes

### GitHub Integration
- **PR Comments**: Automatic status updates
- **Status Checks**: Block merging on visual regressions (optional)
- **Baseline Management**: Approve changes directly from PR

## 🔧 Advanced Configuration

### Custom Chromatic Configuration
Edit `chromatic.config.json`:
```json
{
  "capture": {
    "delay": 500,              // Increase delay for slower components
    "animationTimeout": 2000,  // Longer animation timeout
    "threshold": 0.1           // More sensitive change detection
  }
}
```

### MSW Integration
Visual testing works seamlessly with MSW mocks:
```typescript
export const WithAPI: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/data', () => HttpResponse.json({ success: true }))
      ]
    }
  },
  play: skipPlayInChromatic(async ({ canvasElement }) => {
    // API interactions work in both local and Chromatic
  })
};
```

## 📋 Checklist for New Components

- [ ] Create comprehensive stories covering all states
- [ ] Wrap any play functions with `skipPlayInChromatic`
- [ ] Test responsive behavior with `withViewports`
- [ ] Consider theme variants with `withThemeVariants`  
- [ ] Run local visual test: `pnpm run visual-test`
- [ ] Create PR and review Chromatic results
- [ ] Approve baseline in Chromatic dashboard

## 🎓 Key Benefits

1. **Automated Visual Testing**: Catch visual regressions automatically
2. **Cross-Browser Compatibility**: Test across different browsers in Chromatic
3. **Responsive Design**: Validate components at multiple screen sizes
4. **Team Collaboration**: Visual review process for design changes
5. **CI/CD Integration**: Seamless integration with development workflow
6. **Documentation**: Visual component library serves as living documentation

## 🔗 Resources

- [Chromatic Documentation](https://www.chromatic.com/docs)
- [Storybook Visual Testing](https://storybook.js.org/tutorials/design-systems-for-developers/react/en/visual-testing/)
- [isChromatic Utility](https://www.chromatic.com/docs/ischromatic)
- [Play Function Best Practices](https://storybook.js.org/docs/react/writing-stories/play-function)

---

*This setup provides comprehensive visual regression testing with minimal maintenance overhead and maximum developer productivity.*