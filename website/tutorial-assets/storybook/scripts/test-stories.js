#!/usr/bin/env node

/**
 * Custom Storybook Story Test Runner
 * 
 * This script:
 * 1. Launches Storybook in the background
 * 2. Runs Playwright to test all stories with play functions
 * 3. Reports results
 * 
 * This is a temporary solution until the experimental Vitest addon matures.
 */

const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');

const STORYBOOK_URL = 'http://localhost:6006';
const STORYBOOK_PORT = 6006;

let storybookProcess;
let browser;
let context;

async function startStorybook() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Storybook server...');
    
    storybookProcess = spawn('pnpm', ['dev'], {
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    
    storybookProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:')) {
        console.log('✅ Storybook server ready');
        resolve();
      }
    });
    
    storybookProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('EADDRINUSE')) {
        console.log('✅ Storybook server already running');
        resolve();
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Storybook failed to start within 30 seconds'));
    }, 30000);
  });
}

async function setupBrowser() {
  console.log('🌐 Setting up browser...');
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
}

async function runStoryTests() {
  const page = await context.newPage();
  
  try {
    console.log('🎯 Running story tests...');
    
    // Navigate to Storybook
    await page.goto(STORYBOOK_URL);
    
    // Wait for Storybook to load - try multiple selectors
    await page.waitForLoadState('networkidle');
    
    try {
      await page.waitForSelector('#storybook-explorer-tree', { timeout: 5000 });
    } catch {
      await page.waitForSelector('[data-nodetype="root"]', { timeout: 5000 });
    }
    
    // Debug: Take a screenshot to see what's on the page
    await page.screenshot({ path: 'storybook-debug.png' });
    
    // Get all stories from the sidebar - try different selectors
    let storyLinks = await page.locator('[data-item-id][data-nodetype="story"]').all();
    
    if (storyLinks.length === 0) {
      // Try alternative selector
      storyLinks = await page.locator('[data-testid="story-link"]').all();
    }
    
    if (storyLinks.length === 0) {
      // Try finding story links by text content
      storyLinks = await page.locator('a[href*="path="]').all();
    }
    
    console.log(`📚 Found ${storyLinks.length} stories to test`);
    
    let passedTests = 0;
    let failedTests = 0;
    const results = [];
    
    for (const link of storyLinks) {
      const storyId = await link.getAttribute('data-item-id');
      const storyTitle = await link.innerText();
      
      try {
        // Click on the story
        await link.click();
        
        // Wait for the story to load
        await page.waitForTimeout(1000);
        
        // Check if there's a play function by looking for interaction results
        const hasPlayFunction = await page.locator('[data-testid="icon-play"]').count() > 0 ||
                               await page.locator('.sb-bar').locator('text="Tests"').count() > 0;
        
        if (hasPlayFunction) {
          // Try to run the play function by clicking the play button if it exists
          const playButton = page.locator('[data-testid="icon-play"]');
          if (await playButton.count() > 0) {
            await playButton.click();
            await page.waitForTimeout(2000);
          }
          
          // Check for any error indicators
          const hasErrors = await page.locator('.sb-errordisplay').count() > 0 ||
                           await page.locator('[data-testid="icon-error"]').count() > 0;
          
          if (hasErrors) {
            const errorText = await page.locator('.sb-errordisplay').first().innerText().catch(() => 'Unknown error');
            results.push({ story: storyTitle, status: 'FAILED', error: errorText });
            failedTests++;
            console.log(`❌ ${storyTitle} - FAILED`);
          } else {
            results.push({ story: storyTitle, status: 'PASSED' });
            passedTests++;
            console.log(`✅ ${storyTitle} - PASSED`);
          }
        } else {
          results.push({ story: storyTitle, status: 'SKIPPED', note: 'No play function' });
          console.log(`⏭️  ${storyTitle} - SKIPPED (no play function)`);
        }
        
      } catch (error) {
        results.push({ story: storyTitle, status: 'ERROR', error: error.message });
        failedTests++;
        console.log(`💥 ${storyTitle} - ERROR: ${error.message}`);
      }
    }
    
    // Print summary
    console.log('\\n📊 Test Summary:');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📝 Total Stories: ${results.length}`);
    
    return failedTests === 0;
    
  } catch (error) {
    console.error('❌ Failed to run story tests:', error);
    return false;
  } finally {
    await page.close();
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up...');
  
  if (context) {
    await context.close();
  }
  
  if (browser) {
    await browser.close();
  }
  
  if (storybookProcess && !storybookProcess.killed) {
    storybookProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (!storybookProcess.killed) {
        storybookProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

async function main() {
  try {
    // Check if we should skip starting Storybook (if already running)
    const skipStart = process.argv.includes('--skip-start');
    
    if (!skipStart) {
      await startStorybook();
      // Give Storybook time to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    await setupBrowser();
    const success = await runStoryTests();
    
    await cleanup();
    
    if (success) {
      console.log('\\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\\n💥 Some tests failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    await cleanup();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\\n🛑 Received SIGINT, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\\n🛑 Received SIGTERM, cleaning up...');
  await cleanup();
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { main, runStoryTests };