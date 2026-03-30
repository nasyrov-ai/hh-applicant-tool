import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/dashboard/i);
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
});

test("login with correct password", async ({ page }) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    test.skip();
    return;
  }

  await page.goto("/login");
  await page.fill("input[type='password']", password);
  await page.click("button[type='submit']");
  await page.waitForURL("/");
  expect(page.url()).not.toContain("/login");
});
