/**
 * E2E: Field Ops Tasks – page loads, Create task opens modal (PRD §6.2.3).
 */

import { test, expect } from "@playwright/test";

test.describe("Field Ops Tasks page", () => {
  test("loads and shows Create task button", async ({ page }) => {
    await page.goto("/field-ops/tasks");
    await expect(page.getByText(/tasks/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /create task/i })).toBeVisible();
  });

  test("Create task opens modal with title input", async ({ page }) => {
    await page.goto("/field-ops/tasks");
    await page.getByRole("button", { name: /create task/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const titleInput = page.getByLabel(/title/i).or(page.getByPlaceholder(/replenish/i)).first();
    await expect(titleInput).toBeVisible({ timeout: 3000 });
  });
});
