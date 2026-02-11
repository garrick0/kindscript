#!/usr/bin/env python3
"""
Split docs/04-decisions.md into individual ADR files in docs/decisions/
"""

import re
from pathlib import Path

# Read the monolithic file
decisions_file = Path('docs/04-decisions.md')
content = decisions_file.read_text()

# Split into sections by ## D\d+:
sections = re.split(r'\n## (D\d+): (.+?)\n', content)

# sections[0] is the header/index
header = sections[0]

# Parse the index table to get the metadata
index_pattern = r'\| D(\d+) \| \[([^\]]+)\]\([^\)]+\) \| ([\d-]+) \| (.+?) \|'
index_matches = re.findall(index_pattern, header)

# Create a lookup dict: number -> (title, date, status)
metadata = {}
for num, title, date, status in index_matches:
    metadata[num] = {
        'title': title,
        'date': date,
        'status': status
    }

# Process each ADR
output_dir = Path('docs/decisions')
output_dir.mkdir(exist_ok=True)

adrs = []
for i in range(1, len(sections), 3):
    adr_id = sections[i]  # e.g., "D32"
    title = sections[i+1]  # e.g., "DeclarationOwnership for TypeKind Member Attribution"
    body = sections[i+2]  # The content

    # Extract the number
    num = adr_id.replace('D', '')
    num_padded = num.zfill(4)

    # Get metadata
    meta = metadata.get(num, {'date': 'Unknown', 'status': 'Unknown'})

    # Create slug from title
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)

    filename = f"{num_padded}-{slug}.md"

    # Build the ADR content
    adr_content = f"""# {num}. {title}

Date: {meta['date']}
Status: {meta['status']}

{body.strip()}
"""

    # Write to file
    output_file = output_dir / filename
    output_file.write_text(adr_content)

    adrs.append({
        'num': int(num),
        'num_padded': num_padded,
        'title': title,
        'date': meta['date'],
        'status': meta['status'],
        'filename': filename
    })

    print(f"Created {filename}")

# Sort ADRs by number (descending for newest first)
adrs.sort(key=lambda x: x['num'], reverse=True)

# Create the README index
readme_content = """# Architecture Decision Records

> Key architectural decisions and their rationale.

This directory contains KindScript's Architecture Decision Records (ADRs). Each decision is documented in a separate file for easy navigation, git history tracking, and stable linking.

## Format

Each ADR follows this structure:
- **Context** — The problem or situation requiring a decision
- **Decision** — What was decided
- **Rationale** — Why this decision was made, including alternatives considered
- **Impact** — Consequences and implementation details

## All Decisions

| ADR | Title | Date | Status |
|-----|-------|------|--------|
"""

for adr in adrs:
    readme_content += f"| [ADR-{adr['num_padded']}]({adr['filename']}) | {adr['title']} | {adr['date']} | {adr['status']} |\n"

readme_content += """
## Creating a New ADR

1. Copy `template.md` to `NNNN-title-slug.md` (use next number)
2. Fill in the sections
3. Add entry to this README
4. Commit both files

## Legend

- **Done** — Decision implemented
- **Superseded** — Replaced by a newer decision (see notes in ADR)
- **Deprecated** — No longer recommended but not replaced
"""

readme_file = output_dir / 'README.md'
readme_file.write_text(readme_content)
print(f"\nCreated {readme_file}")

# Create template
template_content = """# N. Title of Decision

Date: YYYY-MM-DD
Status: [Proposed | Done | Superseded | Deprecated]

## Context

What is the issue we're seeing that is motivating this decision or change?

## Decision

What is the change we're actually proposing or doing?

## Rationale

Why are we doing this? What alternatives did we consider?

**Alternatives considered:**

1. **Option A** — description. Rejected because...
2. **Option B** — description. Rejected because...

**Why this approach:**

- Reason 1
- Reason 2

## Impact

What becomes easier or harder as a result of this change? Include:
- Code/architecture changes
- Testing implications
- Documentation updates
- Migration notes (if superseding another ADR)
"""

template_file = output_dir / 'template.md'
template_file.write_text(template_content)
print(f"Created {template_file}")

print(f"\n✓ Split {len(adrs)} ADRs into docs/decisions/")
print(f"✓ Created README.md index")
print(f"✓ Created template.md")
