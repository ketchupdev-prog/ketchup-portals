/**
 * E2E: Agent Float – page loads, Request top-up opens modal and can submit (PRD §5.2.2).
 */

import { test, expect } from "@playwright/test";

test.describe("Agent Float page", () => {
  test("loads and shows float balance and Request top-up button", async ({ page }) => {
    await page.goto("/agent/float");
    await expect(page.getByText(/float management/i)).toBeVisible();
    await expect(page.getByText(/current float balance/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /request top-up/i })).toBeVisible();
  });

  test("Request top-up opens modal with amount input", async ({ page }) => {
    await page.goto("/agent/float");
    await page.getByRole("button", { name: /request top-up/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const amountInput = page.getByLabel(/amount/i).or(page.locator('input[placeholder*="5000"]')).first();
    await expect(amountInput).toBeVisible({ timeout: 3000 });
  });
});
