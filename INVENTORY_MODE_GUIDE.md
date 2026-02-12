# Inventory Mode - Comprehensive Website Audit Guide 📊

**Status:** ✅ Implemented
**Date:** 2026-02-12
**Skill:** `playwright-verify` with `inventory` visual mode

---

## What Is Inventory Mode?

A comprehensive audit mode that goes beyond pass/fail verification to provide:

1. **Complete Discovery** - Finds all pages on your site
2. **Inventory Creation** - Documents everything that exists
3. **Flow Mapping** - Identifies user journeys on each page
4. **Comprehensive Review** - Functional + Visual + UX assessment
5. **Improvement Suggestions** - Not just issues, but opportunities
6. **Living Document** - Updates in real-time as review progresses

## When to Use Inventory Mode

### Perfect For ✅
- **Quarterly/annual site audits**
- **Before major redesigns** (document current state)
- **Stakeholder reviews** (comprehensive report for leadership)
- **QA audit requirements** (thorough documentation)
- **Onboarding new team members** (here's what exists)
- **Pre-acquisition due diligence** (technical assessment)
- **Finding improvement opportunities** (not just fixing bugs)

### Not Ideal For ❌
- Daily verification (use `auto` or `all` mode instead)
- CI/CD pipelines (too slow - use `off` mode)
- Quick checks after changes (use `auto` mode)

---

## How It Works

### Phase 1: Discovery 🔍

**What happens:**
- Starts from homepage
- Extracts all links (navigation, footer, in-page)
- Recursively discovers linked pages
- Builds complete page inventory

**Output:**
```markdown
### Pages Discovered

1. Homepage (/) - Landing page
2. Documentation (/docs) - Hub with 6 sections
3. Tutorial (/tutorial) - Interactive tutorial with 21 lessons
4. Agent Page (/agent) - Product page
5. About (/about) - Company info
...

Total: 34 pages discovered
```

### Phase 2: Flow Mapping 🗺️

**What happens:**
- For each page, identifies user flows
- Categorizes as primary/secondary/navigation
- Documents expected outcomes
- Maps user goals

**Output:**
```markdown
### User Flows Identified

#### Homepage
1. **Primary: Start Learning**
   - Action: Click "Start Interactive Tutorial"
   - Destination: /tutorial
   - Goal: Learn the product

2. **Secondary: Read Docs**
   - Action: Click "Read the Docs"
   - Destination: /docs
   - Goal: Reference material

3. **Secondary: Sign Up**
   - Action: Click "Get Early Access"
   - Destination: /agent#waitlist
   - Goal: Join waitlist

Total: 8 primary flows across all pages
```

### Phase 3: Comprehensive Review 📋

**What happens for each page:**

1. **Navigate** to page
2. **Take screenshot** (full page)
3. **Functional review:**
   - Page loads correctly?
   - Buttons clickable?
   - Forms work?
   - No console errors?
   - Network requests succeed?

4. **Visual review:**
   - Layout proper?
   - Styling applied correctly?
   - Responsive design works?
   - Brand consistency?
   - Images/icons sized correctly?

5. **UX review:**
   - Clear value proposition?
   - Intuitive navigation?
   - Good information hierarchy?
   - Accessibility considerations?
   - Error handling appropriate?

6. **Flow testing:**
   - Execute each identified flow
   - Verify expected outcomes
   - Note any friction points

7. **Document everything:**
   - Issues found
   - Improvement opportunities
   - Screenshots
   - Flow test results

**Output per page:**
```markdown
---

### Homepage

**URL:** /
**Type:** Landing page
**Status:** ⚠️ Good (minor issues)
**Reviewed:** 2026-02-12 14:30

#### Functional Review
- ✅ Loads in 2.1s
- ✅ All buttons work
- ✅ Links navigate correctly
- ⚠️ Search slow on first query (3s)

#### Visual Review
- ✅ Desktop layout proper
- ✅ Mobile responsive
- ⚠️ Hero image cut off on ultrawide (2560px+)

#### UX Review
- ✅ Clear value prop
- ✅ CTA prominent
- ⚠️ Two similar CTAs ("Get Started" vs "Start Tutorial")

#### Flow Testing
- ✅ Flow 1: Start Tutorial - Perfect
- ✅ Flow 2: Read Docs - Works well
- ⚠️ Flow 3: Sign up - Form validation unclear

#### Issues (3)
1. Search slow on first query (Medium)
2. Hero image ultrawide issue (Low)
3. Form validation UX (Medium)

#### Improvements (4)
1. Consolidate similar CTAs
2. Add search loading indicator
3. Improve form error messages
4. Add breadcrumb navigation

#### Screenshot
`homepage-audit.png`

---
```

### Phase 4: Document Updates 📝

**When:**
- After every page review (real-time)
- At checkpoints every 5 pages (summary update)
- At completion (executive summary)

**Why:**
- Progress is visible immediately
- Can stop/resume without losing work
- User can monitor progress during long audits

### Phase 5: Final Summary 📊

**What happens:**
- Aggregate all findings
- Calculate metrics
- Prioritize issues
- Generate recommendations
- Create executive summary

**Output:**
```markdown
## Executive Summary

**Audit Completed:** 2026-02-12 15:15
**Duration:** 45 minutes

### Overview
- Pages reviewed: 34
- Flows tested: 8
- Screenshots: 34
- Issues found: 25
- Improvements: 47

### Status Breakdown
- ✅ Excellent: 18 pages (53%)
- ⚠️ Good: 14 pages (41%)
- 🔧 Needs work: 2 pages (6%)

### Critical Findings

**Must Fix (5 issues):**
1. Broken footer links (affects 5 pages)
2. Form validation unclear (affects all forms)
3. Search timeout on initial query
4. Mobile menu not working (iPad)
5. Tutorial lesson 7 not loading

**Should Fix (8 issues):**
...

**Nice to Have (12 issues):**
...

### Top Recommendations

1. **Consolidate CTAs** - Reduce confusion
2. **Add loading states** - Improve perceived performance
3. **Implement breadcrumbs** - Better navigation
4. **Standardize form validation** - Consistent UX
5. **Add error boundaries** - Better error handling

### Next Steps

**Immediate:**
- Fix broken links
- Fix tutorial lesson 7
- Add form error messages

**This Sprint:**
- CTA consolidation
- Loading indicators
- Mobile menu fix

**Backlog:**
- Breadcrumb implementation
- Error boundary addition
- Performance optimization
```

---

## What You Get

### Files Created

1. **`playwright-audit-[date].md`**
   - Complete audit document (50-200+ pages)
   - Updated in real-time during review
   - Includes:
     - Executive summary
     - Complete page inventory
     - All user flows mapped
     - Detailed review of each page
     - All issues prioritized
     - All improvement suggestions
     - Screenshots referenced

2. **`playwright-screenshots-[date]/`**
   - Full-page screenshot of every page
   - Detail screenshots of important sections
   - Named descriptively (homepage.png, docs-section-1.png, etc.)

3. **`playwright-verification-checklist-[date].md`**
   - Still created for compatibility
   - References main audit document

4. **`playwright-verification-issues-[date].md`**
   - Still created for compatibility
   - Summarizes issues from audit

---

## Usage

### Basic Invocation

```bash
/playwright-verify website local inventory
```

### What Happens

1. Agent creates audit document
2. Agent discovers all pages (5-10 min)
3. Agent maps user flows (5-10 min)
4. Agent reviews each page systematically (20-40 min)
5. Agent updates document after each page
6. You can monitor progress in real-time
7. Agent creates final summary
8. Agent reports completion

### Monitoring Progress

**During execution:**
```bash
# Watch audit document update in real-time
tail -f playwright-audit-2026-02-12.md

# Check current status
grep "Progress:" playwright-audit-2026-02-12.md

# See issues found so far
grep "Issues:" playwright-audit-2026-02-12.md | wc -l
```

---

## Time Estimates

| Site Size | Discovery | Flow Mapping | Review | Total |
|-----------|-----------|--------------|--------|-------|
| Small (10-20 pages) | 5 min | 5 min | 10-15 min | **20-25 min** |
| Medium (20-50 pages) | 10 min | 10 min | 20-30 min | **40-50 min** |
| Large (50-100 pages) | 15 min | 15 min | 40-60 min | **70-90 min** |
| Very Large (100+ pages) | 20 min | 20 min | 60-90 min | **100-130 min** |

**Note:** Times are approximate and depend on:
- Network speed
- Page complexity
- Number of flows per page
- Whether issues are found and fixed during review

---

## Comparison to Other Modes

| Feature | off | auto | all | inventory |
|---------|-----|------|-----|-----------|
| **Functional checks** | ✅ | ✅ | ✅ | ✅ |
| **Screenshots** | ❌ | 1-2 | All | All + details |
| **Visual review** | ❌ | Homepage | All pages | All pages |
| **UX review** | ❌ | ❌ | ❌ | ✅ |
| **Flow testing** | ❌ | ❌ | ❌ | ✅ |
| **Improvements** | ❌ | ❌ | ❌ | ✅ |
| **Page discovery** | ❌ | ❌ | ❌ | ✅ |
| **Living document** | ❌ | ❌ | ❌ | ✅ |
| **Time (30 pages)** | 5 min | 8 min | 15 min | **45 min** |
| **Output pages** | 2 | 3 | 5 | **50+** |

---

## Example Audit Output

See full example in the skill documentation, but here's a snippet:

```markdown
# Website Comprehensive Audit

**Target:** http://localhost:3000
**Date:** 2026-02-12 14:30
**Status:** ✅ Complete

## Executive Summary

**Duration:** 45 minutes
**Pages:** 34 reviewed
**Flows:** 8 tested
**Issues:** 5 critical, 8 medium, 12 low
**Improvements:** 25 opportunities
**Average Score:** 8.4/10

### Top Issues
1. Broken footer links (5 pages) - Critical
2. Form validation unclear - Critical
3. Search slow on first load - Medium

### Top Recommendations
1. Consolidate CTAs across site
2. Add loading indicators
3. Implement breadcrumbs
4. Standardize form validation
5. Add error boundaries

## Inventory

### Pages Discovered (34)
1. Homepage (/) - Landing
2. Documentation (/docs) - Hub
3. Tutorial (/tutorial) - Interactive
...

### User Flows (8 primary)
...

## Review Results

### Homepage
**Status:** ⚠️ Good
**Issues:** 3
**Improvements:** 4
...

### Documentation
**Status:** ✅ Excellent
**Issues:** 0
**Improvements:** 1
...

[... 32 more pages ...]
```

---

## Best Practices

### Before Running

1. **Ensure site is stable** - Don't run during deployments
2. **Have time set aside** - 30-90 min depending on size
3. **Clear your schedule** - Agent needs to focus
4. **Prepare questions** - Any specific areas to focus on?

### During Execution

1. **Don't interrupt** - Let it complete
2. **Monitor progress** - Watch the document update
3. **Note patterns** - Similar issues across pages?
4. **Take notes** - Your own observations

### After Completion

1. **Review audit document** - Read through findings
2. **Prioritize fixes** - What's most important?
3. **Create tasks** - Turn issues into work items
4. **Share with team** - Distribute audit document
5. **Schedule fixes** - Plan remediation work
6. **Set next audit date** - Quarterly? Annually?

---

## Use Cases

### Use Case 1: Quarterly Review
**Goal:** Maintain site quality over time
**Frequency:** Every 3 months
**Focus:** Issues + improvements
**Outcome:** Continuous improvement

### Use Case 2: Pre-Redesign
**Goal:** Document current state
**Frequency:** One-time before redesign
**Focus:** Complete inventory + flows
**Outcome:** Redesign requirements

### Use Case 3: Stakeholder Report
**Goal:** Show leadership site quality
**Frequency:** Ad-hoc when requested
**Focus:** Executive summary + metrics
**Outcome:** Confidence in quality

### Use Case 4: New Team Onboarding
**Goal:** Help new devs understand site
**Frequency:** When new team members join
**Focus:** Inventory + flows
**Outcome:** Faster ramp-up

### Use Case 5: QA Audit
**Goal:** Formal quality assurance
**Frequency:** Pre-release or scheduled
**Focus:** Everything
**Outcome:** Compliance documentation

---

## Tips for Large Sites

### Breaking Up the Work

For sites with 100+ pages:

1. **Run by section:**
   ```bash
   /playwright-verify https://example.com/docs inventory
   /playwright-verify https://example.com/blog inventory
   /playwright-verify https://example.com/app inventory
   ```

2. **Combine results later** - Merge audit documents

3. **Prioritize sections** - Critical pages first

### Focus Areas

If time is limited:

1. **Critical paths only** - Main user journeys
2. **Public pages only** - Skip admin/internal
3. **New pages only** - Recently added content

---

## Questions?

**Q: Can I pause and resume?**
A: Not directly, but the document updates in real-time so you can see progress. If interrupted, re-run and skip already-reviewed pages manually.

**Q: What if I find a critical bug during audit?**
A: Fix it immediately, then continue. Document the fix in the audit.

**Q: Can I customize what gets reviewed?**
A: Currently no, but you can skip pages manually or modify the skill.

**Q: How do I share the audit with non-technical stakeholders?**
A: The executive summary is designed for this. Copy just that section.

**Q: Can I run this on production?**
A: Yes, it's read-only and safe. Just watch for rate limiting on very large sites.

---

## Success Criteria

An inventory mode audit is successful if you:

- ✅ Have complete inventory of all pages
- ✅ Understand all user flows
- ✅ Know every issue on the site
- ✅ Have prioritized fix list
- ✅ Have improvement roadmap
- ✅ Can share results with team
- ✅ Feel confident in site quality

---

**Ready to try it?**

```bash
/playwright-verify website local inventory
```

Then sit back and watch the comprehensive audit unfold! ☕
