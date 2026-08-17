import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const OUT_DIR = resolve(process.cwd(), ".impeccable/review");

const browser = await chromium.launch({ headless: true });

async function capture(path, filename, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: false });
  await context.close();
}

await capture("/", "desktop.png", { width: 1440, height: 900 });
await capture("/", "mobile.png", { width: 390, height: 844 });
await capture("/register", "register-desktop.png", { width: 1440, height: 900 });
await capture("/register", "register-mobile.png", { width: 390, height: 1200 });

await browser.close();
