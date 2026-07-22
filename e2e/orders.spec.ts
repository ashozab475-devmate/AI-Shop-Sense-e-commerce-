import { test, expect } from '@playwright/test';

test.describe('Order Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /shopping|products|home/ });
  });

  test('should view order history', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
    
    // Verify orders page loaded
    await expect(page).toHaveTitle(/Orders|Order History/i);
    
    // Verify orders are displayed
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(1, { timeout: 5000 });
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    
    // Wait for order detail page
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify order details are displayed
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
  });

  test('should display order items', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify order items are displayed
    await expect(page.locator('[data-testid="order-item-product"]')).toHaveCount(2);
    
    // Verify item details
    await expect(page.locator('[data-testid="item-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-quantity"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-price"]')).toBeVisible();
  });

  test('should display order status', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify status is displayed
    const status = await page.locator('[data-testid="order-status"]').textContent();
    expect(['pending', 'processing', 'shipped', 'delivered']).toContain(status?.toLowerCase());
  });

  test('should display shipping address', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify shipping address is displayed
    await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-street"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-city"]')).toBeVisible();
  });

  test('should track order shipment', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify tracking information is displayed
    if (await page.locator('[data-testid="tracking-number"]').isVisible()) {
      await expect(page.locator('[data-testid="tracking-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="tracking-link"]')).toBeVisible();
    }
  });

  test('should cancel pending order', async ({ page }) => {
    await page.goto('/orders');
    
    // Find pending order
    const pendingOrder = page.locator('[data-testid="order-item"]:has-text("Pending")').first();
    
    if (await pendingOrder.isVisible()) {
      // Click on pending order
      await pendingOrder.click();
      await page.waitForNavigation({ url: /orders\/\w+/ });
      
      // Click cancel button
      await page.click('button:has-text("Cancel Order")');
      
      // Confirm cancellation
      await page.click('button:has-text("Confirm|Yes")');
      
      // Verify success message
      await expect(page.locator('text=cancelled|success')).toBeVisible();
      
      // Verify status changed to cancelled
      await expect(page.locator('[data-testid="order-status"]')).toContainText('Cancelled');
    }
  });

  test('should prevent cancelling shipped order', async ({ page }) => {
    await page.goto('/orders');
    
    // Find shipped order
    const shippedOrder = page.locator('[data-testid="order-item"]:has-text("Shipped")').first();
    
    if (await shippedOrder.isVisible()) {
      // Click on shipped order
      await shippedOrder.click();
      await page.waitForNavigation({ url: /orders\/\w+/ });
      
      // Verify cancel button is disabled or not visible
      const cancelButton = page.locator('button:has-text("Cancel Order")');
      if (await cancelButton.isVisible()) {
        await expect(cancelButton).toBeDisabled();
      }
    }
  });

  test('should display order timeline', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify timeline is displayed
    if (await page.locator('[data-testid="order-timeline"]').isVisible()) {
      await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount(1, { timeout: 5000 });
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders');
    
    // Click status filter
    await page.click('select[name="status"]');
    
    // Select pending status
    await page.click('option[value="pending"]');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Verify only pending orders are displayed
    const orders = await page.locator('[data-testid="order-item"]').count();
    expect(orders).toBeGreaterThan(0);
    
    // Verify all orders have pending status
    const statuses = await page.locator('[data-testid="order-status"]').allTextContents();
    statuses.forEach(status => {
      expect(status.toLowerCase()).toContain('pending');
    });
  });

  test('should sort orders by date', async ({ page }) => {
    await page.goto('/orders');
    
    // Click sort dropdown
    await page.click('select[name="sort"]');
    
    // Select newest first
    await page.click('option[value="newest"]');
    
    // Wait for sort to apply
    await page.waitForTimeout(1000);
    
    // Verify orders are sorted
    const dates = await page.locator('[data-testid="order-date"]').allTextContents();
    expect(dates.length).toBeGreaterThan(0);
  });

  test('should download invoice', async ({ page, context }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Listen for download
    const downloadPromise = context.waitForEvent('download');
    
    // Click download invoice button
    await page.click('button:has-text("Download Invoice")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('invoice');
  });

  test('should initiate return request', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Click return button if visible
    const returnButton = page.locator('button:has-text("Return|Request Return")');
    if (await returnButton.isVisible()) {
      await returnButton.click();
      
      // Wait for return form
      await page.waitForTimeout(1000);
      
      // Verify return form is displayed
      await expect(page.locator('[data-testid="return-form"]')).toBeVisible();
    }
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    await page.click('[data-testid="order-item"]:nth-child(1)');
    await page.waitForNavigation({ url: /orders\/\w+/ });
    
    // Verify order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="total"]')).toBeVisible();
  });
});
