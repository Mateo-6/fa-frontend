import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const apiRequire = createRequire(resolve(process.cwd(), "../api/package.json"));
const jwt = apiRequire("jsonwebtoken");

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  try {
    const env = readFileSync(resolve(process.cwd(), "../api/.env"), "utf8");
    const match = env.match(/^\s*JWT_SECRET\s*=\s*(.+)\s*$/m);
    if (match) return match[1].trim();
  } catch {
    /* no api/.env available */
  }
  throw new Error("JWT_SECRET no está definido");
}

function tokenFor(userId) {
  return jwt.sign({ id: userId }, jwtSecret(), { algorithm: "HS256", expiresIn: "15m" });
}

const API = process.env.API_URL || "http://127.0.0.1:3000";
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const OUT_DIR = resolve(process.cwd(), ".impeccable/review/payment-methods");

async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json.message || JSON.stringify(json)}`);
  return json.data;
}

const password = process.env.SEED_USER_PASSWORD || "QaTest!2026";
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_USER_ID = process.env.SEED_USER_ID;
const stamp = Date.now();
const email = SEED_EMAIL || `qa_${stamp}@test.local`;
const created = { paymentMethods: [] };

async function seed() {
  const token = SEED_USER_ID ? tokenFor(SEED_USER_ID) : await (async () => {
    if (!SEED_EMAIL) {
      try {
        await api("/users", {
          method: "POST",
          body: {
            username: `qa_${stamp}`,
            name: "QA Usuario",
            email,
            password,
            phone: "5551234567",
          },
        });
      } catch {
        // fallthrough: log in if the user already exists
      }
    }
    const session = await api("/auth/login", { method: "POST", body: { email, password } });
    return session.token;
  })();

  const pm = async (name, type, currency, details) => {
    const method = await api("/payment-methods", {
      method: "POST",
      body: { name, type, currency, details },
      token,
    });
    created.paymentMethods.push(method.id);
    return method;
  };

  await pm("Visa Credencial", "CREDIT_CARD", "COP", {
    card_number: "4242",
    cut_off_day: 15,
    payment_day: 28,
    credit_limit: 5000000,
    current_balance: 1250000,
  });
  await pm("Mastercard Oro", "CREDIT_CARD", "COP", {
    card_number: "5500",
    cut_off_day: 5,
    payment_day: 22,
    credit_limit: 3000000,
    current_balance: 300000,
  });
  const bancolombia = await pm("Bancolombia Cuenta principal", "BANK_ACCOUNT", "COP", {
    bank_name: "Bancolombia",
    account_number: "1234",
    account_type: "SAVINGS",
    current_balance: 8200000,
  });
  await api(`/payment-methods/${bancolombia.id}/gmf-exempt`, {
    method: "PATCH",
    body: { is_exempt: true },
    token,
  });
  await pm("Nequi", "BANK_ACCOUNT", "COP", {
    bank_name: "Nequi",
    account_number: "5678",
    account_type: "CHECKING",
    current_balance: 450000,
  });
  await pm("Efectivo en casa", "CASH", "COP", { amount: 250000 });

  return { token };
}

async function capture(context, path, filename, viewport, height) {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: Boolean(height) });
  return page;
}

async function cleanup() {
  for (const id of created.paymentMethods) {
    await api("/payment-methods/" + id, { method: "DELETE", token: cleanupToken }).catch(() => {});
  }
  if (!SEED_EMAIL) {
    const session = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    }).catch(() => null);
    if (session?.user?.id) {
      await api("/users/" + session.user.id, { method: "DELETE" }).catch(() => {});
    }
  }
}

let cleanupToken = null;

try {
  await mkdir(OUT_DIR, { recursive: true });
  const { token } = await seed();
  cleanupToken = token;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti, user, theme }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify(user));
      localStorage.setItem("theme", theme);
      const root = document.documentElement;
      if (root && !root.classList.contains("dark")) root.classList.add("dark");
    },
    { jti: token, user: { name: "QA Usuario", email }, theme: "dark" }
  );

  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 390, height: 844 };

  await capture(context, "/payment-methods", "desktop.png", desktop, true);
  await capture(context, "/payment-methods", "mobile.png", mobile, true);

  // Create dialog
  {
    const page = await capture(context, "/payment-methods", "form-desktop.png", { width: 1440, height: 960 }, false);
    await page.getByRole("button", { name: "Nuevo método" }).click();
    await page.waitForSelector('[role="dialog"]');
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel("Límite de crédito").click();
    await dialog.getByLabel("Límite de crédito").pressSequentially("5000000");
    await dialog.getByLabel("Saldo actual").click();
    await dialog.getByLabel("Saldo actual").pressSequentially("1234567.89");
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(OUT_DIR, "create-dialog.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  // Bank account type preselected in the create dialog
  {
    const page = await capture(context, "/payment-methods", "form-bank-desktop.png", { width: 1440, height: 960 }, false);
    await page.getByRole("button", { name: "Nuevo método" }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole("radio", { name: "Cuenta" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(OUT_DIR, "create-dialog-bank.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  // Edit dialog (first row)
  {
    const page = await capture(context, "/payment-methods", "edit-desktop.png", desktop, false);
    const editButtons = page.locator('button[aria-label^="Editar "]');
    await editButtons.first().waitFor({ timeout: 15000 });
    await editButtons.first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(OUT_DIR, "edit-dialog.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  await browser.close();
  console.log("Captures written to", OUT_DIR);
} finally {
  await cleanup().catch((err) => console.error("cleanup error:", err.message));
  console.log("Cleanup done.");
}