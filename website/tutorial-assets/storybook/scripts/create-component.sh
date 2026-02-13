#!/bin/bash

# Script to create a new component following Frontend Container Pattern
# Usage: ./create-component.sh <category> <ComponentName>
# Example: ./create-component.sh organisms ReleasesManager

CATEGORY=$1
COMPONENT_NAME=$2

if [ -z "$CATEGORY" ] || [ -z "$COMPONENT_NAME" ]; then
  echo "Usage: ./create-component.sh <category> <ComponentName>"
  echo "Categories: atoms, molecules, organisms, Pages, templates"
  echo "Example: ./create-component.sh organisms ReleasesManager"
  exit 1
fi

# Validate category
if [[ ! "$CATEGORY" =~ ^(atoms|molecules|organisms|Pages|templates)$ ]]; then
  echo "Invalid category. Must be one of: atoms, molecules, organisms, Pages, templates"
  exit 1
fi

# Create component directory
COMPONENT_DIR="src/components/$CATEGORY/$COMPONENT_NAME"
mkdir -p "$COMPONENT_DIR"

# Convert ComponentName to kebab-case for files
KEBAB_NAME=$(echo "$COMPONENT_NAME" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')

# Create index.ts
cat > "$COMPONENT_DIR/index.ts" << EOF
export { $COMPONENT_NAME } from './$COMPONENT_NAME';
export type { ${COMPONENT_NAME}Props } from './$KEBAB_NAME.types';
EOF

# Create component file
cat > "$COMPONENT_DIR/$COMPONENT_NAME.tsx" << EOF
'use client';

import React from 'react';
import { ${COMPONENT_NAME}Props } from './$KEBAB_NAME.types';
import { use$COMPONENT_NAME } from './use$COMPONENT_NAME';

export function $COMPONENT_NAME({ 
  className,
  ...props 
}: ${COMPONENT_NAME}Props) {
  const {
    data,
    loading,
    error,
    actions
  } = use$COMPONENT_NAME();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className={className}>
      <h2>$COMPONENT_NAME</h2>
      {/* Component implementation */}
    </div>
  );
}
EOF

# Create types file
cat > "$COMPONENT_DIR/$KEBAB_NAME.types.ts" << EOF
export interface ${COMPONENT_NAME}Props {
  className?: string;
  // Add component props here
}

export interface ${COMPONENT_NAME}Data {
  // Add data types here
}
EOF

# Create hook file
cat > "$COMPONENT_DIR/use$COMPONENT_NAME.ts" << EOF
import { useState, useEffect, useCallback } from 'react';
import { ${COMPONENT_NAME}Service } from './$KEBAB_NAME.service';

export function use$COMPONENT_NAME() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const service = new ${COMPONENT_NAME}Service();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.getData();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions = {
    refetch: fetchData,
    // Add more actions here
  };

  return {
    data,
    loading,
    error,
    actions,
  };
}
EOF

# Create service file
cat > "$COMPONENT_DIR/$KEBAB_NAME.service.ts" << EOF
import { ${COMPONENT_NAME}Data } from './$KEBAB_NAME.types';

export class ${COMPONENT_NAME}Service {
  constructor(private apiUrl: string = '/api/$KEBAB_NAME') {}

  async getData(): Promise<${COMPONENT_NAME}Data> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  }

  // Add more service methods here
}

export class Mock${COMPONENT_NAME}Service extends ${COMPONENT_NAME}Service {
  async getData(): Promise<${COMPONENT_NAME}Data> {
    // Return mock data for testing
    return Promise.resolve({
      // Mock data here
    } as ${COMPONENT_NAME}Data);
  }
}
EOF

# Create story file
cat > "$COMPONENT_DIR/$COMPONENT_NAME.stories.tsx" << EOF
import type { Meta, StoryObj } from '@storybook/react';
import { $COMPONENT_NAME } from './$COMPONENT_NAME';

const meta = {
  title: '${CATEGORY}/${COMPONENT_NAME}',
  component: $COMPONENT_NAME,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls here
  },
} satisfies Meta<typeof $COMPONENT_NAME>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const WithData: Story = {
  args: {
    // Props with data
  },
};
EOF

# Create test file
cat > "$COMPONENT_DIR/$COMPONENT_NAME.test.tsx" << EOF
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { $COMPONENT_NAME } from './$COMPONENT_NAME';

describe('$COMPONENT_NAME', () => {
  it('renders without crashing', () => {
    render(<$COMPONENT_NAME />);
    expect(screen.getByText('$COMPONENT_NAME')).toBeInTheDocument();
  });

  // Add more tests here
});
EOF

# Create README
cat > "$COMPONENT_DIR/README.md" << EOF
# $COMPONENT_NAME

Brief description of the $COMPONENT_NAME component.

## Usage

\`\`\`tsx
import { $COMPONENT_NAME } from '@induction/storybook';

<$COMPONENT_NAME />
\`\`\`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| \`className\` | \`string\` | No | CSS class name |

## Files

- \`$COMPONENT_NAME.tsx\` - Main component
- \`use$COMPONENT_NAME.ts\` - Business logic hook
- \`$KEBAB_NAME.service.ts\` - API service
- \`$KEBAB_NAME.types.ts\` - TypeScript types
- \`$COMPONENT_NAME.stories.tsx\` - Storybook stories
- \`$COMPONENT_NAME.test.tsx\` - Unit tests
EOF

echo "✅ Component created at $COMPONENT_DIR"
echo ""
echo "Next steps:"
echo "1. Implement the component logic"
echo "2. Add props to the types file"
echo "3. Implement service methods"
echo "4. Write tests"
echo "5. Add Storybook stories"
echo ""
echo "To view in Storybook: pnpm storybook"
echo "To run tests: pnpm test $COMPONENT_NAME"