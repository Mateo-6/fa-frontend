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
const OUT_DIR = resolve(process.cwd(), ".impeccable/review/transactions");

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
const SEED_USER_ID = process.env.SEED_USER_ID;
const stamp = Date.now();
const email = process.env.SEED_USER_EMAIL || `qa_${stamp}@test.local`;
const created = { transactions: [], categories: [], paymentMethods: [] };

async function seed() {
  const token = SEED_USER_ID
    ? tokenFor(SEED_USER_ID)
    : await (async () => {
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
        const session = await api("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        return session.token;
      })();

  const cat = async (name, type) => {
    const category = await api("/categories", {
      method: "POST",
      body: { name, type },
      token,
    });
    created.categories.push(category.id);
    return category;
  };

  const pm = async (name, type, details) => {
    const method = await api("/payment-methods", {
      method: "POST",
      body: { name, type, currency: "USD", details },
      token,
    });
    created.paymentMethods.push(method.id);
    return method;
  };

  const comida = await cat("Comida", "expense");
  const transporte = await cat("Transporte", "expense");
  const vivienda = await cat("Vivienda", "expense");
  const otros = await cat("Otros", "expense");
  const salario = await cat("Salario", "income");
  const freelance = await cat("Freelance", "income");
  const ahorros = await cat("Ahorros", "transfer");

  const visa = await pm("Visa 4242", "CREDIT_CARD", {
    card_number: "4242",
    cut_off_day: 5,
    payment_day: 22,
    credit_limit: 2000,
    current_balance: 0,
  });
  const nacional = await pm("Banco Nacional", "BANK_ACCOUNT", {
    bank_name: "Banco Nacional",
    account_number: "1234",
    account_type: "SAVINGS",
    current_balance: 1500,
  });
  const efectivo = await pm("Efectivo", "CASH", { amount: 200 });

  const tx = async (transaction) => {
    const item = await api("/transactions/manual", {
      method: "POST",
      body: transaction,
      token,
    });
    created.transactions.push(item.id);
    return item;
  };

  await tx({ amount: 500, description: "Renta de departamento", date: "2026-08-01T00:00:00", type: "EXPENSE", categoryId: vivienda.id, paymentMethodId: nacional.id });
  await tx({ amount: 85.4, description: "Supermercado", date: "2026-08-13T00:00:00", type: "EXPENSE", categoryId: comida.id, paymentMethodId: visa.id });
  await tx({ amount: 12, description: "Uber", date: "2026-08-12T00:00:00", type: "EXPENSE", categoryId: transporte.id, paymentMethodId: efectivo.id });
  await tx({ amount: 34.7, description: "Restaurante", date: "2026-08-15T00:00:00", type: "EXPENSE", categoryId: comida.id, paymentMethodId: visa.id });
  await tx({ amount: 18.5, description: "Cine", date: "2026-08-10T00:00:00", type: "EXPENSE", categoryId: otros.id, paymentMethodId: efectivo.id });
  await tx({ amount: 1800, description: "Salario", date: "2026-08-01T00:00:00", type: "INCOME", categoryId: salario.id, paymentMethodId: nacional.id });
  await tx({ amount: 250, description: "Proyecto freelance", date: "2026-08-05T00:00:00", type: "INCOME", categoryId: freelance.id });
  await tx({ amount: 150, description: "Retiro a efectivo", date: "2026-08-03T00:00:00", type: "TRANSFER", categoryId: ahorros.id, sourcePaymentMethodId: nacional.id, destinationPaymentMethodId: efectivo.id });

  return { token };
}

async function capture(context, path, filename, viewport) {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(OUT_DIR, filename) });
  return page;
}

async function cleanup() {
  for (const id of created.transactions) {
    await api("/transactions/" + id, { method: "DELETE", token: cleanupToken }).catch(() => {});
  }
  for (const id of created.paymentMethods) {
    await api("/payment-methods/" + id, { method: "DELETE", token: cleanupToken }).catch(() => {});
  }
  for (const id of created.categories) {
    await api("/categories/" + id, { method: "DELETE", token: cleanupToken }).catch(() => {});
  }
  if (!SEED_USER_ID) {
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

  await capture(context, "/transactions", "list-desktop.png", desktop);
  await capture(context, "/transactions", "list-mobile.png", mobile);

  // Create dialog (reemplaza la antigua pantalla /transactions/new)
  {
    const page = await capture(context, "/transactions", "new-desktop.png", { width: 1440, height: 1200 });
    await page.getByRole("button", { name: "Nueva transacción" }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(OUT_DIR, "create-dialog-desktop.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }
  {
    const page = await capture(context, "/transactions", "new-mobile.png", mobile);
    await page.getByRole("button", { name: "Nueva transacción" }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(OUT_DIR, "create-dialog-mobile.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  // Filtered view (Tipo = Gastos)
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.getByLabel("Tipo").selectOption("EXPENSE");
    await page.waitForTimeout(900);
    await page.screenshot({ path: resolve(OUT_DIR, "list-filtered.png") });
    await page.close();
  }

  // Edit dialog
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    const editButtons = page.locator('button[aria-label^="Editar "]');
    await editButtons.first().waitFor({ timeout: 15000 });
    const count = await editButtons.count();
    if (count === 0) {
      throw new Error("No se encontraron botones de edición");
    }
    await editButtons.first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(OUT_DIR, "edit-dialog.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  // Delete dialog
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.locator('button[aria-label^="Eliminar "]').first().waitFor({ timeout: 15000 });
    await page.locator('button[aria-label^="Eliminar "]').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(OUT_DIR, "delete-dialog.png") });
    await page.keyboard.press("Escape");
    await page.close();
  }

  await browser.close();
  console.log("Captures written to", OUT_DIR);
} finally {
  await cleanup().catch((err) => console.error("cleanup error:", err.message));
  console.log("Cleanup done.");
}