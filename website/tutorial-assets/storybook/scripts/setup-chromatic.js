#!/usr/bin/env node

/**
 * Chromatic Setup Script
 * 
 * This script helps set up Chromatic for visual regression testing.
 * It provides instructions and checks for proper configuration.
 */

const fs = require('fs');
const path = require('path');

class ChromaticSetup {
  constructor() {
    this.configPath = './chromatic.config.json';
    this.packageJsonPath = './package.json';
  }

  checkSetup() {
    console.log('🎨 Chromatic Visual Testing Setup Check\n');

    const checks = [
      this.checkConfigFile(),
      this.checkPackageJson(),
      this.checkProjectToken(),
      this.checkStorybook(),
    ];

    const passed = checks.filter(check => check.status === 'pass').length;
    const total = checks.length;

    console.log(`\n📊 Setup Status: ${passed}/${total} checks passed\n`);

    if (passed === total) {
      console.log('✅ Chromatic is fully configured and ready to use!');
      console.log('\nNext steps:');
      console.log('1. Set CHROMATIC_PROJECT_TOKEN in your environment');
      console.log('2. Run: pnpm run visual-test');
      console.log('3. Check the Chromatic dashboard for results\n');
    } else {
      console.log('❌ Some setup steps are incomplete. Please address the issues above.');
    }

    return passed === total;
  }

  checkConfigFile() {
    const exists = fs.existsSync(this.configPath);
    const status = exists ? 'pass' : 'fail';
    
    console.log(`${status === 'pass' ? '✅' : '❌'} Chromatic config file`);
    
    if (!exists) {
      console.log('   → chromatic.config.json not found');
      console.log('   → Run this script to create the configuration');
    } else {
      console.log('   → chromatic.config.json found');
    }

    return { check: 'config', status };
  }

  checkPackageJson() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8'));
    const hasChromatic = packageJson.devDependencies?.chromatic;
    const hasScripts = packageJson.scripts?.chromatic && packageJson.scripts?.['visual-test'];
    
    const status = hasChromatic && hasScripts ? 'pass' : 'fail';
    
    console.log(`${status === 'pass' ? '✅' : '❌'} Package.json configuration`);
    
    if (!hasChromatic) {
      console.log('   → Chromatic dependency missing');
      console.log('   → Run: pnpm add -D chromatic');
    }
    
    if (!hasScripts) {
      console.log('   → Chromatic scripts missing');
      console.log('   → Add "chromatic" and "visual-test" scripts to package.json');
    }
    
    if (hasChromatic && hasScripts) {
      console.log('   → Chromatic dependency and scripts configured');
    }

    return { check: 'package', status };
  }

  checkProjectToken() {
    const hasToken = process.env.CHROMATIC_PROJECT_TOKEN;
    const status = hasToken ? 'pass' : 'fail';
    
    console.log(`${status === 'pass' ? '✅' : '❌'} Project token`);
    
    if (!hasToken) {
      console.log('   → CHROMATIC_PROJECT_TOKEN environment variable not set');
      console.log('   → Get token from: https://www.chromatic.com');
      console.log('   → Set in GitHub Secrets for CI/CD');
    } else {
      console.log('   → Project token configured');
    }

    return { check: 'token', status };
  }

  checkStorybook() {
    const storybookExists = fs.existsSync('./.storybook');
    const buildScript = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8')).scripts?.['build-storybook'];
    
    const status = storybookExists && buildScript ? 'pass' : 'fail';
    
    console.log(`${status === 'pass' ? '✅' : '❌'} Storybook configuration`);
    
    if (!storybookExists) {
      console.log('   → .storybook directory not found');
      console.log('   → Ensure Storybook is properly configured');
    }
    
    if (!buildScript) {
      console.log('   → build-storybook script not found');
      console.log('   → Add build script to package.json');
    }
    
    if (storybookExists && buildScript) {
      console.log('   → Storybook configured for building');
    }

    return { check: 'storybook', status };
  }

  generateInstructions() {
    console.log(`
🎨 Chromatic Visual Testing Setup Guide

Chromatic provides automated visual testing for your Storybook stories.
It captures screenshots of your components and detects visual changes.

## 1. Create Chromatic Account
   Visit: https://www.chromatic.com
   Sign up with your GitHub account
   Create a new project for your repository

## 2. Get Project Token
   After creating the project, copy your project token
   Set it as an environment variable:
   
   Local development:
   export CHROMATIC_PROJECT_TOKEN="your-token-here"
   
   GitHub Actions:
   Add CHROMATIC_PROJECT_TOKEN to repository secrets

## 3. Run Visual Tests
   Local testing:
   pnpm run visual-test
   
   The tests will:
   - Build your Storybook
   - Upload to Chromatic
   - Compare with baseline screenshots
   - Report any visual changes

## 4. Review Changes
   Visit the Chromatic dashboard to:
   - Review detected changes
   - Accept or reject visual updates
   - Set up baseline for new components

## 5. CI/CD Integration
   The GitHub Action workflow will:
   - Run automatically on PRs
   - Comment on PRs with results
   - Block merging if visual tests fail (optional)

## Benefits
   ✅ Catch unintended visual changes
   ✅ Ensure design consistency
   ✅ Collaborative design review
   ✅ Visual testing across browsers
   ✅ Integration with GitHub PRs

For more information: https://www.chromatic.com/docs
`);
  }
}

// Main execution
async function main() {
  const setup = new ChromaticSetup();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    setup.generateInstructions();
    return;
  }
  
  if (args.includes('--check')) {
    setup.checkSetup();
    return;
  }
  
  // Default: show instructions and run check
  setup.generateInstructions();
  setup.checkSetup();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ChromaticSetup };