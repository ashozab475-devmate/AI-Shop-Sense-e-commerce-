import { test, expect } from '@playwright/test';

test.describe('Shopping Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /shopping|products|home/ });
  });

  test('should browse products on shopping page', async ({ page }) => {
    // Navigate to shopping page
    await page.goto('/shopping');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Shopping|Products|Browse/i);
    
    // Verify products are displayed
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(10, { timeout: 5000 });
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/shopping');
    
    // Click category filter
    await page.click('button:has-text("Electronics")');
    
    // Wait for products to update
    await page.waitForTimeout(1000);
    
    // Verify filtered products
    const products = await page.locator('[data-testid="product-card"]').count();
    expect(products).toBeGreaterThan(0);
    
    // Verify all products are in Electronics category
    const categories = await page.locator('[data-testid="product-category"]').allTextContents();
    categories.forEach(cat => {
      expect(cat).toContain('Electronics');
    });
  });

  test('should search products by name', async ({ page }) => {
    await page.goto('/shopping');
    
    // Fill search box
    await page.fill('input[placeholder*="Search"]', 'Laptop');
    
    // Press Enter or click search button
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const products = await page.locator('[data-testid="product-card"]').count();
    expect(products).toBeGreaterThan(0);
    
    // Verify product names contain search term
    const names = await page.locator('[data-testid="product-name"]').allTextContents();
    names.forEach(name => {
      expect(name.toLowerCase()).toContain('laptop');
    });
  });

  test('should sort products by price', async ({ page }) => {
    await page.goto('/shopping');
    
    // Click sort dropdown
    await page.click('select[name="sort"]');
    
    // Select price ascending
    await page.click('option[value="price-asc"]');
    
    // Wait for products to update
    await page.waitForTimeout(1000);
    
    // Get prices
    const prices = await page.locator('[data-testid="product-price"]').allTextContents();
    const numPrices = prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
    
    // Verify prices are sorted ascending
    for (let i = 1; i < numPrices.length; i++) {
      expect(numPrices[i]).toBeGreaterThanOrEqual(numPrices[i - 1]);
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/shopping');
    
    // Get initial cart count
    const initialCount = await page.locator('[data-testid="cart-count"]').textContent();
    
    // Click add to cart button on first product
    await page.click('[data-testid="product-card"] >> button:has-text("Add to Cart")');
    
    // Verify success message
    await expect(page.locator('text=Added to cart|success')).toBeVisible();
    
    // Verify cart count increased
    const updatedCount = await page.locator('[data-testid="cart-count"]').textContent();
    expect(parseInt(updatedCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
  });

  test('should add multiple products to cart', async ({ page }) => {
    await page.goto('/shopping');
    
    // Add first product
    await page.click('[data-testid="product-card"]:nth-child(1) >> button:has-text("Add to Cart")');
    await page.waitForTimeout(500);
    
    // Add second product
    await page.click('[data-testid="product-card"]:nth-child(2) >> button:has-text("Add to Cart")');
    await page.waitForTimeout(500);
    
    // Add third product
    await page.click('[data-testid="product-card"]:nth-child(3) >> button:has-text("Add to Cart")');
    
    // Verify cart count is 3
    const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
    expect(parseInt(cartCount || '0')).toBe(3);
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/shopping');
    
    // Click on product card
    await page.click('[data-testid="product-card"]:nth-child(1)');
    
    // Wait for product detail page
    await page.waitForNavigation({ url: /products\/\w+/ });
    
    // Verify product details are displayed
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-rating"]')).toBeVisible();
  });

  test('should view product reviews', async ({ page }) => {
    await page.goto('/shopping');
    
    // Click on product
    await page.click('[data-testid="product-card"]:nth-child(1)');
    await page.waitForNavigation({ url: /products\/\w+/ });
    
    // Scroll to reviews section
    await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();
    
    // Verify reviews are displayed
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(5, { timeout: 5000 });
  });

  test('should add product to wishlist', async ({ page }) => {
    await page.goto('/shopping');
    
    // Click wishlist button on first product
    await page.click('[data-testid="product-card"]:nth-child(1) >> button[aria-label="Add to wishlist"]');
    
    // Verify success message
    await expect(page.locator('text=Added to wishlist|success')).toBeVisible();
    
    // Verify wishlist icon is filled
    const wishlistButton = page.locator('[data-testid="product-card"]:nth-child(1) >> button[aria-label="Add to wishlist"]');
    await expect(wishlistButton).toHaveClass(/filled|active/);
  });

  test('should handle out of stock products', async ({ page }) => {
    await page.goto('/shopping');
    
    // Find out of stock product
    const outOfStockButton = page.locator('[data-testid="product-card"] >> button:has-text("Out of Stock")').first();
    
    if (await outOfStockButton.isVisible()) {
      // Verify button is disabled
      await expect(outOfStockButton).toBeDisabled();
      
      // Verify out of stock label
      await expect(page.locator('text=Out of Stock')).toBeVisible();
    }
  });

  test('should paginate through products', async ({ page }) => {
    await page.goto('/shopping');
    
    // Get first page products
    const firstPageCount = await page.locator('[data-testid="product-card"]').count();
    
    // Click next page button
    await page.click('button:has-text("Next")');
    
    // Wait for new products to load
    await page.waitForTimeout(1000);
    
    // Verify new products are displayed
    const secondPageCount = await page.locator('[data-testid="product-card"]').count();
    expect(secondPageCount).toBeGreaterThan(0);
  });
});
