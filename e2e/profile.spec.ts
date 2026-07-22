import { test, expect } from '@playwright/test';

test.describe('User Profile E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: /shopping|products|home/ });
  });

  test('should view user profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify profile page loaded
    await expect(page).toHaveTitle(/Profile|Account/i);
    
    // Verify profile information is displayed
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
  });

  test('should edit profile information', async ({ page }) => {
    await page.goto('/profile');
    
    // Click edit button
    await page.click('button:has-text("Edit Profile")');
    
    // Wait for edit form
    await page.waitForTimeout(500);
    
    // Update profile information
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="phone"]', '555-9876');
    await page.fill('input[name="address"]', '456 Oak Avenue');
    
    // Save changes
    await page.click('button:has-text("Save|Update")');
    
    // Verify success message
    await expect(page.locator('text=updated|saved|success')).toBeVisible();
    
    // Verify changes are displayed
    await expect(page.locator('[data-testid="profile-name"]')).toContainText('Jane Doe');
  });

  test('should validate email format on profile update', async ({ page }) => {
    await page.goto('/profile');
    
    // Click edit button
    await page.click('button:has-text("Edit Profile")');
    await page.waitForTimeout(500);
    
    // Try to update with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    
    // Try to save
    await page.click('button:has-text("Save|Update")');
    
    // Verify validation error
    await expect(page.locator('text=valid email|invalid email')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/profile');
    
    // Click edit button
    await page.click('button:has-text("Edit Profile")');
    await page.waitForTimeout(500);
    
    // Try to update with invalid phone
    await page.fill('input[name="phone"]', '123'); // Too short
    
    // Try to save
    await page.click('button:has-text("Save|Update")');
    
    // Verify validation error
    await expect(page.locator('text=phone|invalid')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.goto('/profile');
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    
    // Wait for password form
    await page.waitForTimeout(500);
    
    // Fill password form
    await page.fill('input[name="oldPassword"]', 'SecurePassword123!');
    await page.fill('input[name="newPassword"]', 'NewSecurePassword456!');
    await page.fill('input[name="confirmPassword"]', 'NewSecurePassword456!');
    
    // Submit form
    await page.click('button:has-text("Change|Update")');
    
    // Verify success message
    await expect(page.locator('text=changed|updated|success')).toBeVisible();
  });

  test('should validate old password on change', async ({ page }) => {
    await page.goto('/profile');
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    await page.waitForTimeout(500);
    
    // Fill with wrong old password
    await page.fill('input[name="oldPassword"]', 'WrongPassword123!');
    await page.fill('input[name="newPassword"]', 'NewSecurePassword456!');
    await page.fill('input[name="confirmPassword"]', 'NewSecurePassword456!');
    
    // Submit form
    await page.click('button:has-text("Change|Update")');
    
    // Verify error message
    await expect(page.locator('text=incorrect|wrong|invalid')).toBeVisible();
  });

  test('should validate new password strength', async ({ page }) => {
    await page.goto('/profile');
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    await page.waitForTimeout(500);
    
    // Fill with weak new password
    await page.fill('input[name="oldPassword"]', 'SecurePassword123!');
    await page.fill('input[name="newPassword"]', '123'); // Too weak
    await page.fill('input[name="confirmPassword"]', '123');
    
    // Submit form
    await page.click('button:has-text("Change|Update")');
    
    // Verify validation error
    await expect(page.locator('text=strong|at least|characters')).toBeVisible();
  });

  test('should require password confirmation match', async ({ page }) => {
    await page.goto('/profile');
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    await page.waitForTimeout(500);
    
    // Fill with mismatched passwords
    await page.fill('input[name="oldPassword"]', 'SecurePassword123!');
    await page.fill('input[name="newPassword"]', 'NewSecurePassword456!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword789!');
    
    // Submit form
    await page.click('button:has-text("Change|Update")');
    
    // Verify error message
    await expect(page.locator('text=match|do not match')).toBeVisible();
  });

  test('should upload profile picture', async ({ page }) => {
    await page.goto('/profile');
    
    // Click upload picture button
    await page.click('button:has-text("Upload Picture|Change Picture")');
    
    // Wait for file input
    await page.waitForTimeout(500);
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/profile-picture.jpg');
    
    // Wait for upload
    await page.waitForTimeout(2000);
    
    // Verify success message
    await expect(page.locator('text=uploaded|success')).toBeVisible();
    
    // Verify picture is displayed
    await expect(page.locator('[data-testid="profile-picture"]')).toBeVisible();
  });

  test('should validate profile picture file type', async ({ page }) => {
    await page.goto('/profile');
    
    // Click upload picture button
    await page.click('button:has-text("Upload Picture|Change Picture")');
    await page.waitForTimeout(500);
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/document.pdf');
    
    // Verify error message
    await expect(page.locator('text=image|jpg|png|invalid')).toBeVisible();
  });

  test('should validate profile picture file size', async ({ page }) => {
    await page.goto('/profile');
    
    // Click upload picture button
    await page.click('button:has-text("Upload Picture|Change Picture")');
    await page.waitForTimeout(500);
    
    // Try to upload large file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/large-image.jpg');
    
    // Verify error message
    await expect(page.locator('text=too large|size|MB')).toBeVisible();
  });

  test('should view order history from profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Scroll to order history section
    await page.locator('[data-testid="order-history-section"]').scrollIntoViewIfNeeded();
    
    // Verify order history is displayed
    await expect(page.locator('[data-testid="order-history-section"]')).toBeVisible();
    
    // Verify orders are listed
    if (await page.locator('[data-testid="profile-order-item"]').count() > 0) {
      await expect(page.locator('[data-testid="profile-order-item"]')).toHaveCount(1, { timeout: 5000 });
    }
  });

  test('should view wishlist from profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Click wishlist tab
    await page.click('button:has-text("Wishlist")');
    
    // Wait for wishlist to load
    await page.waitForTimeout(1000);
    
    // Verify wishlist is displayed
    if (await page.locator('[data-testid="wishlist-item"]').count() > 0) {
      await expect(page.locator('[data-testid="wishlist-item"]')).toHaveCount(1, { timeout: 5000 });
    }
  });

  test('should view saved addresses', async ({ page }) => {
    await page.goto('/profile');
    
    // Click addresses tab
    await page.click('button:has-text("Addresses")');
    
    // Wait for addresses to load
    await page.waitForTimeout(1000);
    
    // Verify addresses are displayed
    if (await page.locator('[data-testid="address-item"]').count() > 0) {
      await expect(page.locator('[data-testid="address-item"]')).toHaveCount(1, { timeout: 5000 });
    }
  });

  test('should add new address', async ({ page }) => {
    await page.goto('/profile');
    
    // Click addresses tab
    await page.click('button:has-text("Addresses")');
    await page.waitForTimeout(500);
    
    // Click add address button
    await page.click('button:has-text("Add Address")');
    
    // Wait for form
    await page.waitForTimeout(500);
    
    // Fill address form
    await page.fill('input[name="street"]', '789 Pine Road');
    await page.fill('input[name="city"]', 'Los Angeles');
    await page.fill('input[name="state"]', 'CA');
    await page.fill('input[name="zipCode"]', '90001');
    
    // Save address
    await page.click('button:has-text("Save|Add")');
    
    // Verify success message
    await expect(page.locator('text=added|saved|success')).toBeVisible();
  });

  test('should delete address', async ({ page }) => {
    await page.goto('/profile');
    
    // Click addresses tab
    await page.click('button:has-text("Addresses")');
    await page.waitForTimeout(500);
    
    // Get initial address count
    const initialCount = await page.locator('[data-testid="address-item"]').count();
    
    // Click delete button on first address
    await page.click('[data-testid="address-item"]:nth-child(1) >> button[aria-label="Delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm|Yes|Delete")');
    
    // Verify address removed
    const updatedCount = await page.locator('[data-testid="address-item"]').count();
    expect(updatedCount).toBe(initialCount - 1);
  });

  test('should logout from profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Click logout button
    await page.click('button:has-text("Logout|Sign Out")');
    
    // Confirm logout
    if (await page.locator('button:has-text("Confirm|Yes")').isVisible()) {
      await page.click('button:has-text("Confirm|Yes")');
    }
    
    // Verify redirect to signin
    await page.waitForNavigation({ url: /signin|login/ });
    await expect(page).toHaveURL(/signin|login/);
  });
});
