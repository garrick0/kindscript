#!/usr/bin/env node

/**
 * Script to wrap play functions with skipPlayInChromatic
 */

const fs = require('fs');
const path = require('path');

function wrapPlayFunctions(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Track if we've made changes
  let hasChanges = false;
  
  // Add import if not present
  if (!content.includes('skipPlayInChromatic')) {
    const importLine = `import { skipPlayInChromatic } from '../../../../../../apps/storybook/.storybook/utils/chromatic-helpers';`;
    
    // Find the @storybook/test import line and add after it
    content = content.replace(
      /import.*@storybook\/test.*;/,
      `$&\n${importLine}`
    );
    hasChanges = true;
  }
  
  // Replace play function patterns and close the wrapper
  const lines = content.split('\n');
  const newLines = [];
  let insidePlayFunction = false;
  let playFunctionDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a play function that's already wrapped
    if (line.includes('play: skipPlayInChromatic(async')) {
      insidePlayFunction = true;
      playFunctionDepth = 0;
      newLines.push(line);
      continue;
    }
    
    // If we're inside a play function, track braces
    if (insidePlayFunction) {
      // Count opening and closing braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      playFunctionDepth += openBraces - closeBraces;
      
      newLines.push(line);
      
      // If we've closed all braces, add the closing parenthesis
      if (playFunctionDepth <= 0 && line.includes('},')) {
        // Replace the }, with }),
        const lastIndex = newLines.length - 1;
        newLines[lastIndex] = newLines[lastIndex].replace('},', '}),');
        insidePlayFunction = false;
        hasChanges = true;
      }
    } else {
      newLines.push(line);
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`✅ Updated ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
    return false;
  }
}

// Process all story files
function processStoryFiles() {
  const storyFiles = [
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/molecules/Form/v1.0.0/Form.stories.tsx',
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/molecules/GlobalSearch/v1.0.0/GlobalSearch.stories.tsx',
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/molecules/LoginButton/v1.0.0/LoginButton.stories.tsx',
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/molecules/Sidebar/v1.0.0/Sidebar.stories.tsx',
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/atoms/Button/v1.0.0/Button.stories.tsx',
    '/Users/samuelgleeson/dev/induction-studio/packages/design-system/src/components/organisms/Navigation/v1.0.0/Navigation.stories.tsx'
  ];
  
  let totalUpdated = 0;
  
  for (const file of storyFiles) {
    if (fs.existsSync(file)) {
      if (wrapPlayFunctions(file)) {
        totalUpdated++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalUpdated} files updated`);
}

if (require.main === module) {
  processStoryFiles();
}

module.exports = { wrapPlayFunctions };