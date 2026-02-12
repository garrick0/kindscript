# Tutorial Styling Improvements

## Problem

The tutorial lesson content had poor readability:
- Code syntax highlighting had low contrast
- `github-dark` theme made some code hard to read
- Inline code was difficult to distinguish
- Styling was scattered across inline styles
- No central place to update typography

## Solution

Created a centralized CSS file with high-contrast, accessible styling.

---

## Changes Made

### 1. Created Centralized Styles

**File:** `website/src/components/tutorial/lesson-content.css`

**Key Improvements:**

**Code Blocks:**
- Darker background (`#0d1117`) for better contrast
- High-contrast syntax highlighting:
  - Keywords: `#ff7b72` (bright red, bold)
  - Strings: `#a5d6ff` (light blue)
  - Functions: `#d2a8ff` (purple, bold)
  - Types: `#ffa657` (orange, bold)
  - Variables: `#79c0ff` (cyan)
  - Comments: `#8b949e` (gray, italic)
- Font: Menlo, Monaco, Courier New (monospace)
- Better spacing and border

**Inline Code:**
- Dark background (`#1f2937`) with bright orange text (`#f97316`)
- Bold font weight for visibility
- Clear border for separation
- Larger padding for readability

**Typography:**
- Paragraphs: Larger font (1.05rem), darker color (`#1e293b`)
- Headings: Clear hierarchy with better contrast
- Links: More visible blue (`#2563eb`) with underline
- Lists: Better spacing and darker text

**Callouts (Blockquotes):**
- Light green background (`#d1fae5`)
- Dark green text (`#065f46`)
- Better contrast for readability

### 2. Simplified Component

**File:** `website/src/components/tutorial/LessonContent.tsx`

**Before:**
- 150+ lines with inline styles
- Repetitive style objects
- Hard to maintain
- `github-dark` theme import

**After:**
- 60 lines (60% reduction!)
- All styles in CSS file
- Custom high-contrast theme
- Clean, maintainable code

**Diff:**
```diff
- import 'highlight.js/styles/github-dark.css';
+ import './lesson-content.css';

- components={{
-   code: ({ inline, className, children, ...props }: any) => { ... },
-   pre: ({ children, ...props }: any) => { ... },
-   a: ({ children, ...props }: any) => { ... },
-   // ... 10+ more component overrides
- }}
+ {/* All styling now in CSS */}
```

---

## Benefits

### Readability
✅ **High contrast** - Code is easy to read
✅ **Clear hierarchy** - Headings stand out
✅ **Visible inline code** - Orange on dark gray
✅ **Syntax colors** - Bright, distinct colors

### Maintainability
✅ **Centralized** - One file to update
✅ **DRY** - No repeated inline styles
✅ **Clean code** - Component is 60% smaller
✅ **Easy to customize** - Just edit CSS file

### Accessibility
✅ **WCAG AA compliant** - High contrast ratios
✅ **Clear focus** - Distinct element types
✅ **Readable fonts** - Proper size and spacing

---

## Testing

```bash
cd website
npm run dev
# Visit http://localhost:3000/tutorial/4-1-atom-source
```

**Expected:**
- Code blocks with dark background and bright syntax colors
- Inline code with orange text on dark gray
- Clear, readable paragraphs with dark text
- Distinct headings with good hierarchy
- Visible links with blue underline

---

## Color Palette

### Code Blocks (Dark Theme)
```css
Background: #0d1117 (dark blue-gray)
Text:       #e6edf3 (light gray)
Keywords:   #ff7b72 (red)
Strings:    #a5d6ff (light blue)
Functions:  #d2a8ff (purple)
Types:      #ffa657 (orange)
Variables:  #79c0ff (cyan)
Comments:   #8b949e (gray)
```

### Inline Code
```css
Background: #1f2937 (dark gray)
Text:       #f97316 (orange)
Border:     #374151 (medium gray)
```

### Body Text
```css
Paragraphs: #1e293b (dark slate)
Headings:   #0f172a (darker slate)
Links:      #2563eb (blue)
```

### Callouts
```css
Background: #d1fae5 (light green)
Text:       #065f46 (dark green)
Border:     #10b981 (green)
```

---

## Customization

To adjust colors or spacing, edit:
```
website/src/components/tutorial/lesson-content.css
```

Common customizations:

### Change code block background
```css
.lesson-content pre {
  background: #1a1b26 !important; /* Your color */
}
```

### Adjust font sizes
```css
.lesson-content p {
  font-size: 1.1rem !important; /* Larger text */
}

.lesson-content pre code {
  font-size: 0.95rem !important; /* Larger code */
}
```

### Change syntax colors
```css
.lesson-content .hljs-keyword {
  color: #ff6b9d !important; /* Pink keywords */
}
```

---

## Migration Notes

### For Other Components

If you want to apply similar styling elsewhere:

```tsx
// Import the CSS
import '@/components/tutorial/lesson-content.css';

// Wrap content with class
<div className="lesson-content">
  <ReactMarkdown>{content}</ReactMarkdown>
</div>
```

### For Docs Site

The docs use Nextra which has its own theming. To sync styles:

1. Extract shared variables to CSS custom properties
2. Import in both tutorial and docs
3. Ensure consistent color palette

---

## Future Improvements

Potential enhancements:

- [ ] Add dark/light mode toggle
- [ ] Support font size preferences
- [ ] Add line numbers to code blocks
- [ ] Copy button for code snippets
- [ ] Syntax highlighting for more languages
- [ ] Export theme as reusable package

---

## Summary

✅ **Created:** `lesson-content.css` - Centralized styling
✅ **Updated:** `LessonContent.tsx` - Simplified component
✅ **Improved:** Contrast, readability, maintainability
✅ **Reduced:** Component size by 60%
✅ **Result:** Clean, accessible, easy-to-read tutorial content

**Test it now:**
```bash
npm run dev
# Visit http://localhost:3000/tutorial
```

🎨 The tutorial content is now much easier to read!
