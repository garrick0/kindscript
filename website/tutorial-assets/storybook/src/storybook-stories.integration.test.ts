import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from '@playwright/test';

describe.skip('Storybook Stories Integration Tests (requires running Storybook server)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Component Stories Rendering', () => {
    const componentStories = [
      // Atoms
      { id: 'atoms-button--default', name: 'Button Default' },
      { id: 'atoms-input--default', name: 'Input Default' },
      
      // Molecules
      { id: 'molecules-card--default', name: 'Card Default' },
      { id: 'molecules-form--default', name: 'Form Default' },
      { id: 'molecules-login-button--default', name: 'Login Button Default' },
      { id: 'molecules-sidebar--default', name: 'Sidebar Default' },
      
      // Organisms
      { id: 'organisms-releases-manager--default', name: 'Releases Manager' },
      { id: 'organisms-document-manager--default', name: 'Document Manager' },
      { id: 'organisms-create-release-form--default', name: 'Create Release Form' },
      
      // Pages
      { id: 'pages-dashboard--default', name: 'Dashboard Page' },
      { id: 'pages-releases--default', name: 'Releases Page' },
      { id: 'pages-documents--default', name: 'Documents Page' },
      { id: 'pages-settings--default', name: 'Settings Page' },
    ];

    componentStories.forEach(({ id, name }) => {
      it(`should render ${name} story without errors`, async () => {
        const url = `http://localhost:6006/iframe.html?id=${id}&viewMode=story`;
        
        // Navigate to the story
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        
        // Check if page loaded successfully
        expect(response?.status()).toBe(200);
        
        // Check for error messages
        const errorElement = await page.$('[data-test-id="error-message"]');
        expect(errorElement).toBeNull();
        
        // Check that content is rendered
        const content = await page.content();
        expect(content).not.toContain('Story not found');
        expect(content).not.toContain('Error');
      });
    });
  });

  describe('Story Interactions', () => {
    it('should handle button clicks in Button stories', async () => {
      const url = 'http://localhost:6006/iframe.html?id=atoms-button--clickable&viewMode=story';
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Find and click the button
      const button = await page.$('button');
      expect(button).not.toBeNull();
      
      // Set up console listener for click event
      const consoleMessages: string[] = [];
      page.on('console', msg => consoleMessages.push(msg.text()));
      
      await button?.click();
      
      // Check if click was handled (depends on story implementation)
      expect(consoleMessages.some(msg => msg.includes('clicked'))).toBe(true);
    });

    it('should handle form submissions in Form stories', async () => {
      const url = 'http://localhost:6006/iframe.html?id=molecules-form--with-validation&viewMode=story';
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Fill form fields
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for success or error states
      const successMessage = await page.$('[data-test-id="success-message"]');
      const errorMessage = await page.$('[data-test-id="error-message"]');
      
      // Either success or proper validation error should appear
      expect(successMessage !== null || errorMessage !== null).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should render Dashboard correctly on ${name}`, async () => {
        await page.setViewportSize({ width, height });
        
        const url = 'http://localhost:6006/iframe.html?id=pages-dashboard--default&viewMode=story';
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Check that content adapts to viewport
        const content = await page.$('[data-test-id="dashboard-content"]');
        expect(content).not.toBeNull();
        
        // Take screenshot for visual regression (if needed)
        // await page.screenshot({ path: `screenshots/dashboard-${name.toLowerCase()}.png` });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels in LoginButton', async () => {
      const url = 'http://localhost:6006/iframe.html?id=molecules-login-button--default&viewMode=story';
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Check for ARIA labels
      const button = await page.$('button[aria-label]');
      expect(button).not.toBeNull();
      
      const ariaLabel = await button?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have proper focus management in Forms', async () => {
      const url = 'http://localhost:6006/iframe.html?id=molecules-form--default&viewMode=story';
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON']).toContain(firstFocused);
      
      await page.keyboard.press('Tab');
      const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON']).toContain(secondFocused);
    });
  });
});