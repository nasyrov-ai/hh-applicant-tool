import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const SECRET = "hh2026";
const OUT_DIR = join(import.meta.dirname, "..", "docs", "screenshots");

const PAGES = [
  { path: "/", name: "overview", waitFor: "canvas" },
  { path: "/operations", name: "operations" },
  { path: "/negotiations", name: "negotiations" },
  { path: "/vacancies", name: "vacancies" },
  { path: "/logs", name: "logs" },
  { path: "/employers", name: "employers" },
  { path: "/resumes", name: "resumes" },
  { path: "/schedules", name: "schedules" },
  { path: "/settings", name: "settings" },
  { path: "/blacklist", name: "blacklist" },
];

async function screenshot(page, name, theme) {
  const filename = `${name}-${theme}.png`;
  await page.screenshot({
    path: join(OUT_DIR, filename),
    fullPage: false,
  });
  console.log(`  ✓ ${filename}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Set auth cookie
  await context.addCookies([
    {
      name: "hh_dashboard_auth",
      value: SECRET,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);

  const page = await context.newPage();

  // Also take login page (no auth needed, separate context)
  console.log("📸 Login page...");
  const loginCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const loginPage = await loginCtx.newPage();
  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await loginPage.screenshot({
    path: join(OUT_DIR, "login-dark.png"),
    fullPage: false,
  });
  console.log("  ✓ login-dark.png");

  // Switch to light mode
  await loginPage.evaluate(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  });
  await loginPage.waitForTimeout(500);
  await loginPage.screenshot({
    path: join(OUT_DIR, "login-light.png"),
    fullPage: false,
  });
  console.log("  ✓ login-light.png");
  await loginCtx.close();

  // Screenshot all authenticated pages
  for (const { path, name, waitFor } of PAGES) {
    console.log(`📸 ${name}...`);
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 5000 }).catch(() => {});
    }
    // Extra settle time for animations
    await page.waitForTimeout(800);

    // Dark mode (default)
    await screenshot(page, name, "dark");

    // Switch to light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    });
    await page.waitForTimeout(500);
    await screenshot(page, name, "light");

    // Reset to dark mode for next page
    await page.evaluate(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
  }

  await browser.close();
  console.log(`\n✅ Done! Screenshots saved to docs/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
