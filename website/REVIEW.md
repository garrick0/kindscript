# Website Review Checklist

## Overview
This document tracks the status of every page and component on the KindScript website.

**Review Date:** 2026-02-11
**Reviewer:** Claude (Playwright automation)
**Status Legend:**
- ⏳ Not yet reviewed
- ✅ Verified working
- ⚠️ Issues found
- ❌ Broken

---

## Landing Page

- [ ] ⏳ `/` - Landing page
  - [ ] Hero section renders
  - [ ] Feature cards (3) display correctly
  - [ ] Code example has syntax highlighting
  - [ ] "Read the Docs" button works
  - [ ] "Start Interactive Tutorial" button works
  - [ ] Footer displays

---

## Documentation Pages (Nextra)

### Main Chapters
- [ ] ⏳ `/docs` - Documentation index
- [ ] ⏳ `/docs/architecture` - Architecture chapter
- [ ] ⏳ `/docs/kind-system` - Kind System chapter
- [ ] ⏳ `/docs/constraints` - Constraints chapter
- [ ] ⏳ `/docs/examples` - Examples chapter
- [ ] ⏳ `/docs/tutorial-guide` - Tutorial Guide chapter

### Architecture Decision Records (32 total)
- [ ] ⏳ `/docs/decisions` - ADR index page
- [ ] ⏳ `/docs/decisions/0001-language-service-plugin-instead-of-custom-lsp`
- [ ] ⏳ `/docs/decisions/0002-no-ts-morph`
- [ ] ⏳ `/docs/decisions/0003-type-alias-instead-of-interface-extends`
- [ ] ⏳ `/docs/decisions/0004-use-satisfies-instead-of-runtime-markers`
- [ ] ⏳ `/docs/decisions/0005-self-registering-contract-plugins`
- [ ] ⏳ `/docs/decisions/0006-remove-standard-library-packages`
- [ ] ⏳ `/docs/decisions/0007-flatten-srcruntime`
- [ ] ⏳ `/docs/decisions/0008-remove-contractconfigt`
- [ ] ⏳ `/docs/decisions/0009-drop-kts-piggyback-on-typescript-type-checker`
- [ ] ⏳ `/docs/decisions/0010-four-stage-pipeline-alignment`
- [ ] ⏳ `/docs/decisions/0011-pipeline-cleanup-separation-of-concerns`
- [ ] ⏳ `/docs/decisions/0012-rename-instanceconfigt-to-instancet`
- [ ] ⏳ `/docs/decisions/0013-rename-constraintconfig-to-constraints`
- [ ] ⏳ `/docs/decisions/0014-file-scoped-leaf-instances`
- [ ] ⏳ `/docs/decisions/0015-unified-kind-type-typekind-as-sugar`
- [ ] ⏳ `/docs/decisions/0016-resolution-moves-from-parser-to-binder`
- [ ] ⏳ `/docs/decisions/0017-remove-mustimplement-exists-mirrors-plugins`
- [ ] ⏳ `/docs/decisions/0018-semantic-error-messages`
- [ ] ⏳ `/docs/decisions/0019-ownership-tree-for-recursive-instance-containment`
- [ ] ⏳ `/docs/decisions/0020-auto-generated-implicit-contracts-for-overlap-detection`
- [ ] ⏳ `/docs/decisions/0021-opt-in-exhaustiveness-via-exhaustive-true`
- [ ] ⏳ `/docs/decisions/0022-intra-file-dependency-checking-for-typekind-members`
- [ ] ⏳ `/docs/decisions/0023-sourceref-value-object-replacing-raw-location-fields`
- [ ] ⏳ `/docs/decisions/0024-instancet-path-explicit-location-replaces-convention-based-derivation`
- [ ] ⏳ `/docs/decisions/0025-importedge-moved-from-domain-to-application-layer`
- [ ] ⏳ `/docs/decisions/0026-isp-split-ports-into-sub-interfaces`
- [ ] ⏳ `/docs/decisions/0027-scope-plugin-and-kindconfigscope-for-declared-instance-scope`
- [ ] ⏳ `/docs/decisions/0028-container-resolution-as-separate-binder-concern`
- [ ] ⏳ `/docs/decisions/0029-aapps-architecture-onion-core-with-per-product-apps`
- [ ] ⏳ `/docs/decisions/0030-pure-path-utilities-extracted-to-infrastructure`
- [ ] ⏳ `/docs/decisions/0031-intrinsic-constraint-propagation-pattern`
- [ ] ⏳ `/docs/decisions/0032-declarationownership-for-typekind-member-attribution`

---

## Tutorial Pages

### Tutorial Index
- [ ] ⏳ `/tutorial` - Tutorial index (lesson browser)
  - [ ] All 5 parts display
  - [ ] Part 1: noDependency (3 lessons)
  - [ ] Part 2: purity (2 lessons)
  - [ ] Part 3: noCycles (2 lessons)
  - [ ] Part 4: Design System (4 lessons)
  - [ ] Part 5: Molecules (4 lessons)
  - [ ] Lesson links work

### Part 1: noDependency
- [ ] ⏳ `/tutorial/1-1-hello-kindscript`
  - [ ] Loading overlay shows
  - [ ] WebContainer boots
  - [ ] npm install completes
  - [ ] Lesson content renders (MDX)
  - [ ] File tree shows 4 files
  - [ ] Editor opens src/context.ts
  - [ ] Syntax highlighting works
  - [ ] Can edit files
  - [ ] Run Check button works
  - [ ] Shows "0 violations"
  - [ ] Show Solution button works
  - [ ] Reset button works
  - [ ] Next button navigates to 1-2

- [ ] ⏳ `/tutorial/1-2-catching-violations`
  - [ ] Lesson content renders
  - [ ] Files load correctly
  - [ ] Run Check shows violation
  - [ ] Solution fixes violation

- [ ] ⏳ `/tutorial/1-3-fix-the-violation`
  - [ ] Lesson content renders
  - [ ] Challenge lesson works
  - [ ] User can fix violation

### Part 2: purity
- [ ] ⏳ `/tutorial/2-1-pure-layers`
  - [ ] Lesson content renders
  - [ ] purity constraint explained
  - [ ] Run Check shows purity violation

- [ ] ⏳ `/tutorial/2-2-fix-purity`
  - [ ] Challenge lesson works
  - [ ] Solution demonstrates DI pattern

### Part 3: noCycles
- [ ] ⏳ `/tutorial/3-1-detecting-cycles`
  - [ ] Lesson content renders
  - [ ] Cycle violation shown

- [ ] ⏳ `/tutorial/3-2-break-the-cycle`
  - [ ] Challenge lesson works
  - [ ] Solution breaks cycle

### Part 4: Design System
- [ ] ⏳ `/tutorial/4-1-atom-source`
  - [ ] Lesson content renders
  - [ ] Component modeling explained

- [ ] ⏳ `/tutorial/4-2-atom-story`
  - [ ] Multi-file Kind shown

- [ ] ⏳ `/tutorial/4-3-atom-version`
  - [ ] Version pattern explained
  - [ ] noDependency constraint

- [ ] ⏳ `/tutorial/4-4-full-atom`
  - [ ] Complete composition shown

### Part 5: Molecules
- [ ] ⏳ `/tutorial/5-1-molecule-source`
- [ ] ⏳ `/tutorial/5-2-molecule-story`
- [ ] ⏳ `/tutorial/5-3-molecule-version`
- [ ] ⏳ `/tutorial/5-4-full-molecule`

---

## Components

### Tutorial UI Components
- [ ] ⏳ BrowserCheck
  - [ ] Detects SharedArrayBuffer
  - [ ] Shows fallback on unsupported browsers
  - [ ] Links work in fallback

- [ ] ⏳ CodeEditor
  - [ ] Monaco loads
  - [ ] TypeScript syntax highlighting
  - [ ] Accepts user input
  - [ ] onChange fires
  - [ ] Multi-file support (via path prop)

- [ ] ⏳ ErrorBoundary
  - [ ] Catches errors
  - [ ] Shows error UI
  - [ ] Reload button works
  - [ ] Back button works

- [ ] ⏳ FileTree
  - [ ] Lists all files
  - [ ] Shows active file highlight
  - [ ] Click switches files
  - [ ] Files grouped correctly

- [ ] ⏳ LessonContent
  - [ ] MDX renders properly
  - [ ] Code blocks highlighted
  - [ ] Callouts (:::tip) styled
  - [ ] Links work
  - [ ] Headings render

- [ ] ⏳ LessonNav
  - [ ] Previous button (when available)
  - [ ] Next button (when available)
  - [ ] Links navigate correctly

- [ ] ⏳ LoadingOverlay
  - [ ] Shows during boot
  - [ ] Shows during install
  - [ ] Hides when ready
  - [ ] Animated dots work

- [ ] ⏳ Terminal
  - [ ] xterm.js renders
  - [ ] Accepts input
  - [ ] Shows output
  - [ ] Fits container
  - [ ] Resizes properly

- [ ] ⏳ TutorialLayout
  - [ ] 3-panel layout works
  - [ ] Lesson content (left)
  - [ ] File tree (middle-left)
  - [ ] Editor + Terminal (right)
  - [ ] Top nav bar
  - [ ] Bottom nav bar
  - [ ] All buttons functional

- [ ] ⏳ WebContainerProvider
  - [ ] Boots successfully
  - [ ] Mounts template files
  - [ ] Runs npm install
  - [ ] Starts shell
  - [ ] writeFile works
  - [ ] runCommand works
  - [ ] State updates propagate

---

## Navigation & Integration

- [ ] ⏳ Top Navbar (Nextra)
  - [ ] Logo/home link works
  - [ ] Docs link works
  - [ ] Tutorial link works
  - [ ] GitHub link works (if configured)

- [ ] ⏳ Docs Sidebar
  - [ ] All chapters listed
  - [ ] Collapsible sections
  - [ ] Active page highlighted
  - [ ] Scroll to active item

- [ ] ⏳ Search (Pagefind)
  - [ ] Search box appears
  - [ ] Search returns results
  - [ ] Results link to correct pages

---

## Cross-Browser Testing

- [ ] ⏳ Chrome (Desktop)
- [ ] ⏳ Firefox (Desktop)
- [ ] ⏳ Safari (Desktop)
- [ ] ⏳ Edge (Desktop)
- [ ] ⏳ Mobile Chrome (should show fallback)
- [ ] ⏳ Mobile Safari (should show fallback)

---

## Performance

- [ ] ⏳ Landing page loads < 3s
- [ ] ⏳ Docs pages load < 3s
- [ ] ⏳ Tutorial index loads < 3s
- [ ] ⏳ WebContainer boots < 60s (first time)
- [ ] ⏳ No console errors on docs
- [ ] ⏳ No console errors on tutorial (except expected warnings)

---

## Notes

*This section will be updated during review with findings, issues, and observations.*

---

## Summary

**Total Items:** 68
- Landing: 1
- Docs: 39 (6 chapters + 1 index + 32 ADRs)
- Tutorial: 16 (1 index + 15 lessons)
- Components: 10
- Other: 2 (navigation, performance)

**Review Progress:** 0/68 (0%)

---

**Last Updated:** 2026-02-11 (created)
**Next Update:** After Playwright review
