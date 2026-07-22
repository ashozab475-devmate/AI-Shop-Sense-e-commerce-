import { test, expect } from '@playwright/test';

test.describe('Checkout and Payment E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and add products to cart
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /shopping|products|home/ });

    // Add products to cart
    await page.goto('/shopping');
    await page.click('[data-testid="product-card"]:nth-child(1) >> button:has-text("Add to Cart")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="product-card"]:nth-child(2) >> button:has-text("Add to Cart")');
  });

  test('should view cart with added products', async ({ page }) => {
    // Navigate to cart
    await page.goto('/cart');
    
    // Verify cart page loaded
    await expect(page).toHaveTitle(/Cart|Shopping Cart/i);
    
    // Verify products are displayed
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    
    // Verify cart total is calculated
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('should update cart item quantity', async ({ page }) => {
    await page.goto('/cart');
    
    // Get initial total
    const initialTotal = await page.locator('[data-testid="cart-total"]').textContent();
    
    // Increase quantity of first item
    await page.click('[data-testid="cart-item"]:nth-child(1) >> button[aria-label="Increase quantity"]');
    
    // Wait for total to update
    await page.waitForTimeout(500);
    
    // Verify total increased
    const updatedTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(parseFloat(updatedTotal || '0')).toBeGreaterThan(parseFloat(initialTotal || '0'));
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Get initial item count
    const initialCount = await page.locator('[data-testid="cart-item"]').count();
    
    // Remove first item
    await page.click('[data-testid="cart-item"]:nth-child(1) >> button[aria-label="Remove"]');
    
    // Verify item removed
    const updatedCount = await page.locator('[data-testid="cart-item"]').count();
    expect(updatedCount).toBe(initialCount - 1);
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/cart');
    
    // Click checkout button
    await page.click('button:has-text("Proceed to Checkout")');
    
    // Wait for checkout page
    await page.waitForNavigation({ url: /checkout/ });
    
    // Verify checkout page loaded
    await expect(page).toHaveTitle(/Checkout/i);
  });

  test('should fill shipping address', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping address form
    await page.fill('input[name="street"]', '123 Main Street');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');
    await page.fill('input[name="country"]', 'United States');

    // Verify form is filled
    await expect(page.locator('input[name="street"]')).toHaveValue('123 Main Street');
    await expect(page.locator('input[name="city"]')).toHaveValue('New York');
  });

  test('should validate required shipping fields', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to proceed without filling address
    await page.click('button:has-text("Continue to Payment")');
    
    // Verify validation errors
    await expect(page.locator('text=required|please fill')).toBeVisible();
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verify order summary is displayed
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    
    // Verify items are listed
    await expect(page.locator('[data-testid="summary-item"]')).toHaveCount(2);
    
    // Verify subtotal, tax, and total
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="total"]')).toBeVisible();
  });

  test('should fill payment information', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping address
    await page.fill('input[name="street"]', '123 Main Street');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');
    
    // Click continue to payment
    await page.click('button:has-text("Continue to Payment")');
    
    // Wait for payment form
    await page.waitForTimeout(1000);
    
    // Verify Stripe payment form is loaded
    await expect(page.locator('[data-testid="stripe-payment-form"]')).toBeVisible();
  });

  test('should handle payment with test card', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping address
    await page.fill('input[name="street"]', '123 Main Street');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');
    
    // Continue to payment
    await page.click('button:has-text("Continue to Payment")');
    await page.waitForTimeout(1000);
    
    // Fill payment form with test card
    const frameHandle = await page.$('iframe[title*="Stripe"]');
    if (frameHandle) {
      const frame = await frameHandle.contentFrame();
      if (frame) {
        await frame.fill('input[name="cardnumber"]', '4242424242424242');
        await frame.fill('input[name="exp-date"]', '12/25');
        await frame.fill('input[name="cvc"]', '123');
      }
    }
    
    // Submit payment
    await page.click('button:has-text("Pay|Complete Purchase")');
    
    // Wait for success page
    await page.waitForNavigation({ url: /success|order-confirmation/ });
    
    // Verify success page
    await expect(page).toHaveURL(/success|order-confirmation/);
  });

  test('should show order confirmation', async ({ page }) => {
    // Assuming we're on success page after payment
    await page.goto('/checkout/success');
    
    // Verify success message
    await expect(page.locator('text=Thank you|Order Confirmed|Success')).toBeVisible();
    
    // Verify order number is displayed
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    
    // Verify order details
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
  });

  test('should handle payment failure', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping address
    await page.fill('input[name="street"]', '123 Main Street');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');
    
    // Continue to payment
    await page.click('button:has-text("Continue to Payment")');
    await page.waitForTimeout(1000);
    
    // Fill payment form with declined card
    const frameHandle = await page.$('iframe[title*="Stripe"]');
    if (frameHandle) {
      const frame = await frameHandle.contentFrame();
      if (frame) {
        await frame.fill('input[name="cardnumber"]', '4000000000000002'); // Declined card
        await frame.fill('input[name="exp-date"]', '12/25');
        await frame.fill('input[name="cvc"]', '123');
      }
    }
    
    // Submit payment
    await page.click('button:has-text("Pay|Complete Purchase")');
    
    // Verify error message
    await expect(page.locator('text=declined|failed|error')).toBeVisible();
  });

  test('should allow returning to cart from checkout', async ({ page }) => {
    await page.goto('/checkout');
    
    // Click back to cart button
    await page.click('button:has-text("Back to Cart")');
    
    // Verify redirect to cart
    await page.waitForNavigation({ url: /cart/ });
    await expect(page).toHaveURL(/cart/);
  });

  test('should apply coupon code', async ({ page }) => {
    await page.goto('/checkout');
    
    // Get initial total
    const initialTotal = await page.locator('[data-testid="total"]').textContent();
    
    // Fill coupon code
    await page.fill('input[name="couponCode"]', 'SAVE10');
    
    // Click apply button
    await page.click('button:has-text("Apply")');
    
    // Wait for discount to apply
    await page.waitForTimeout(1000);
    
    // Verify discount is applied
    await expect(page.locator('[data-testid="discount"]')).toBeVisible();
    
    // Verify total decreased
    const updatedTotal = await page.locator('[data-testid="total"]').textContent();
    expect(parseFloat(updatedTotal || '0')).toBeLessThan(parseFloat(initialTotal || '0'));
  });
});
