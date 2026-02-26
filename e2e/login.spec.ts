/**
 * E2E: Login page – loads, has email/password inputs and Sign in button (PRD §7.1).
 */

import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("loads and shows sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("has link to create account", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  });
});
