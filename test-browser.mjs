import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if key elements exist
    const heroExists = await page.locator('.hero-content').count() > 0;
    console.log('Hero section exists:', heroExists);
    
    const navExists = await page.locator('nav').count() > 0;
    console.log('Navigation exists:', navExists);
    
    if (errors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      errors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('\nNo console errors detected!');
    }
    
    if (warnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      warnings.forEach(warn => console.log('WARNING:', warn));
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
