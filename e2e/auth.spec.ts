import { test, expect } from '@playwright/test';

test.describe('User Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth tokens
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full signup flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');
    
    // Verify signup page is loaded
    await expect(page).toHaveTitle(/Sign Up|Register/i);
    await expect(page.locator('text=Sign Up')).toBeVisible();

    // Fill signup form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to signin or success message
    await page.waitForNavigation({ url: /signin|login|success/ });
    
    // Verify success
    await expect(page).toHaveURL(/signin|login|success/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    // First signup
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Wait for first signup to complete
    await page.waitForTimeout(2000);

    // Try signup again with same email
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=already exists|already registered')).toBeVisible();
  });

  test('should complete full signin flow', async ({ page }) => {
    // Navigate to signin page
    await page.goto('/signin');
    
    // Verify signin page is loaded
    await expect(page).toHaveTitle(/Sign In|Login/i);
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Fill signin form
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/shopping
    await page.waitForNavigation({ url: /shopping|dashboard|home/ });
    
    // Verify successful login
    await expect(page).toHaveURL(/shopping|dashboard|home/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    
    // Fill with wrong credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid credentials|not found|incorrect')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/signup');
    
    // Try weak password
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', '123'); // Too weak
    await page.fill('input[name="confirmPassword"]', '123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify validation error
    await expect(page.locator('text=password.*strong|at least|characters')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill with invalid email
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify validation error
    await expect(page.locator('text=valid email|invalid email')).toBeVisible();
  });

  test('should require password confirmation match', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify validation error
    await expect(page.locator('text=passwords.*match|do not match')).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    // First signin
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /shopping|dashboard|home/ });

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Verify redirect to signin
    await page.waitForNavigation({ url: /signin|login/ });
    await expect(page).toHaveURL(/signin|login/);
  });
});
