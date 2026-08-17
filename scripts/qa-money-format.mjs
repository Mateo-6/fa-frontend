import { chromium } from "playwright";
import { resolve } from "node:path";
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

const API = process.env.API_URL || "http://127.0.0.1:3000";
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const USER_ID = process.env.SEED_USER_ID || "6a81f0383964eecdcbb1ddf4";
const EMAIL = process.env.SEED_USER_EMAIL || "qa_capture@test.local";
const TOKEN = jwt.sign({ id: USER_ID }, jwtSecret(), { algorithm: "HS256", expiresIn: "15m" });

let failures = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : ` — esperado "${expected}", real "${actual}"`}`);
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` };
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json.message || JSON.stringify(json)}`);
  return json.data;
}

async function seed() {
  const category = await api("/categories", {
    method: "POST",
    body: { name: "Comida", type: "expense" },
  });
  const bank = await api("/payment-methods", {
    method: "POST",
    body: {
      name: "Banco Formato",
      type: "BANK_ACCOUNT",
      currency: "COP",
      details: { bank_name: "Formatos", account_number: "9999", account_type: "SAVINGS", current_balance: 8200000 },
    },
  });
  return { category, bank };
}

async function purge() {
  const methods = await api("/payment-methods").catch(() => []);
  for (const m of methods) {
    if (/Banco Formato|Efectivo formateado/.test(m.name)) {
      await api("/payment-methods/" + m.id, { method: "DELETE" }).catch(() => {});
    }
  }
  const categories = await api("/categories").catch(() => []);
  for (const c of categories) {
    if (c.name === "Comida") await api("/categories/" + c.id, { method: "DELETE" }).catch(() => {});
  }
  const history = await api("/transactions/history?limit=100").catch(() => ({ items: [] }));
  for (const t of history.items ?? []) {
    if (t.description === "Gasto formateado") {
      await api("/transactions/" + t.id, { method: "DELETE" }).catch(() => {});
    }
  }
}

async function cleanup(created) {
  if (created.transaction) await api("/transactions/" + created.transaction.id, { method: "DELETE" }).catch(() => {});
  if (created.method) await api("/payment-methods/" + created.method.id, { method: "DELETE" }).catch(() => {});
  if (created.bank) await api("/payment-methods/" + created.bank.id, { method: "DELETE" }).catch(() => {});
  if (created.category) await api("/categories/" + created.category.id, { method: "DELETE" }).catch(() => {});
  await purge();
}

async function main() {
  await purge();
  const created = await seed();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify({ name: "QA Money", email: EMAIL }));
      localStorage.setItem("theme", "dark");
      document.documentElement?.classList.add("dark");
    },
    { jti: TOKEN }
  );

  // --- Payment method form formatting ---
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Nuevo método" }).click();
  await page.waitForSelector('[role="dialog"]');
  const dialog = page.locator('[role="dialog"]');

  await dialog.getByRole("radio", { name: "Efectivo" }).click();
  const monto = dialog.getByLabel("Monto en efectivo");
  await monto.fill("2500000");
  check("efectivo: 2.500.000", await monto.inputValue(), "2.500.000");

  await dialog.getByRole("radio", { name: "Cuenta" }).click();
  await dialog.getByLabel("Tipo de cuenta").selectOption("SAVINGS");
  const saldo = dialog.getByLabel("Saldo actual").first();
  await saldo.fill("8200000");
  check("cuenta: 8.200.000", await saldo.inputValue(), "8.200.000");
  await saldo.fill(",00");
  check("cuenta: ", await saldo.inputValue(), "0,00");

  await dialog.getByRole("radio", { name: "Tarjeta" }).click();
  const limite = dialog.getByLabel("Límite de crédito");
  await limite.click();
  await limite.pressSequentially("1000000");
  check("tarjeta: 1.000.000 por tecla", await limite.inputValue(), "1.000.000");

  const tarjeta = dialog.getByLabel("Saldo actual");
  await tarjeta.fill("");
  await tarjeta.click();
  await tarjeta.pressSequentially("12345.99");
  check("tarjeta saldo: 12.345,99 por tecla", await tarjeta.inputValue(), "12.345,99");

  // create efectivo with formatted value persisted correctly
  await dialog.getByRole("radio", { name: "Efectivo" }).click();
  await dialog.getByLabel("Nombre").fill("Efectivo formateado");
  await monto.fill("1500000.5");
  check("efectivo decimal: 1.500.000,5", await monto.inputValue(), "1.500.000,5");
  await dialog.getByRole("button", { name: "Crear método" }).click();
  await page.waitForSelector('text=Método de pago creado', { timeout: 10000 });
  await page.waitForTimeout(700);
  const stored = await api("/payment-methods").then((methods) =>
    methods.some((m) => m.name === "Efectivo formateado" && m.details.amount === 1500000.5)
  );
  check("persiste monto 1500000,5 como número", stored, true);
  const createdMethod = await api("/payment-methods").then((methods) =>
    methods.find((m) => m.name === "Efectivo formateado")
  );
  created.method = createdMethod;

  // --- Edit prefills formatted ---
  await page.locator('button[aria-label="Editar Banco Formato"]').first().click();
  await page.waitForTimeout(300);
  const editSaldo = page.locator('[role="dialog"]').getByLabel("Saldo actual").first();
  check("edit prefila 8.200.000", await editSaldo.inputValue(), "8.200.000");
  await page.keyboard.press("Escape");

  // --- Transaction form formatting ---
  const txPage = await context.newPage();
  await txPage.setViewportSize({ width: 1440, height: 1100 });
  await txPage.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await txPage.getByRole("button", { name: "Nueva transacción" }).click();
  await txPage.waitForSelector('[role="dialog"]');
  const txDialog = txPage.locator('[role="dialog"]');
  await txDialog.getByLabel("Categoría").waitFor({ timeout: 15000 });
  const importe = txDialog.getByLabel("Importe");
  await importe.click();
  await importe.pressSequentially("1800000.50");
  check("transacción importe: 1.800.000,50 por tecla", await importe.inputValue(), "1.800.000,50");

  await txDialog.getByLabel("Descripción").fill("Gasto formateado");
  await txDialog.getByLabel("Categoría").selectOption({ index: 1 });
  await txDialog.getByLabel("Método de pago").selectOption({ index: 1 });
  await txDialog.getByRole("button", { name: "Crear transacción" }).click();
  await txPage.locator('[role="dialog"]').waitFor({ state: "detached", timeout: 15000 });
  await txPage.getByText("$1,800,000.50").first().waitFor({ timeout: 15000 });
  const txStored = await api("/transactions/history?limit=1").then((h) =>
    h.items.some((t) => t.description === "Gasto formateado" && t.amount === 1800000.5)
  );
  check("transacción persiste 1.800.000,5", txStored, true);
  created.transaction = await api("/transactions/history?limit=50").then((h) =>
    h.items.find((t) => t.description === "Gasto formateado")
  );

  await browser.close();
  await cleanup(created);
  console.log(failures === 0 ? "ALL MONEY FORMAT CHECKS PASSED" : `FAILED: ${failures} checks`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err.message || err);
  await purge().catch(() => {});
  process.exit(1);
});