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

function tokenFor(userId) {
  return jwt.sign({ id: userId }, jwtSecret(), { algorithm: "HS256", expiresIn: "15m" });
}

const API = process.env.API_URL || "http://127.0.0.1:3000";
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";

const SEED_EMAIL = process.env.SEED_USER_EMAIL || "qa_capture@test.local";
const SEED_USER_ID = process.env.SEED_USER_ID || "6a81f0383964eecdcbb1ddf4";
const EMPTY_USER_ID = process.env.EMPTY_USER_ID || "6a81f0b1ac6f802175b1ddf4";
const emptyEmail = process.env.EMPTY_USER_EMAIL || "qa_empty@test.local";

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

function check(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

const results = [];
function auditFile(name, checks) {
  results.push({ name, checks });
}

async function auditViewport(context, label, { width, height }) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const payload = await page.evaluate(() => {
    const overflowX = document.documentElement.scrollWidth > window.innerWidth;
    const bodyScroll = document.body.scrollWidth;
    return {
      overflowX,
      bodyScroll,
      innerWidth: window.innerWidth,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      summaryPresent: Boolean(document.querySelector("section.glass-panel .flex")),
      hasVisa: document.body.textContent?.includes("Visa Credencial") ?? false,
      hasBancolombia: document.body.textContent?.includes("Bancolombia Cuenta principal") ?? false,
      hasEfectivo: document.body.textContent?.includes("Efectivo en casa") ?? false,
      groups: [...document.querySelectorAll("h2")].map((el) => el.textContent?.trim()),
      switches: document.querySelectorAll('[role="switch"]').length,
      progressbars: document.querySelectorAll('[role="progressbar"]').length,
      rows: document.querySelectorAll("section.glass-panel").length,
    };
  });

  check(`${label}: sin desborde horizontal`, !payload.overflowX, payload.overflowX ? `scroll ${payload.bodyScroll} > inner ${payload.innerWidth}` : "OK");
  check(`${label}: h1 correcto`, payload.h1 === "Métodos de pago", payload.h1);
  check(`${label}: tarjeta presente`, payload.hasVisa);
  check(`${label}: cuenta bancaria presente`, payload.hasBancolombia);
  check(`${label}: efectivo presente`, payload.hasEfectivo);
  check(`${label}: grupos renderizados`, payload.groups.length >= 3, JSON.stringify(payload.groups));
  check(`${label}: switches GMF`, payload.switches >= 1, `${payload.switches} switch(es)`);
  check(`${label}: barras de utilización`, payload.progressbars >= 2, `${payload.progressbars} barra(s)`);
  check(`${label}: sin errores de consola`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  const rules = await page.evaluate(() => {
    const text = document.body.textContent ?? "";
    const nequiRow = [...document.querySelectorAll("div.group")].find((s) =>
      s.textContent?.includes("Nequi")
    );
    return {
      hint: nequiRow?.textContent?.includes("corriente") ?? false,
      checkingSwitch: Boolean(nequiRow?.querySelector('[role="switch"]')),
    };
  });
  check(`${label}: cuenta corriente sin switch GMF`, !rules.checkingSwitch);
  check(`${label}: hint de corriente visible`, rules.hint);

  return page;
}

async function auditGmfToggle(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const nequiSwitch = page.locator('[role="switch"][aria-label*="Bancolombia"]');
  await nequiSwitch.waitFor({ timeout: 15000 });
  const before = await nequiSwitch.getAttribute("aria-checked");
  await nequiSwitch.click();
  await page.waitForTimeout(900);
  const after = await nequiSwitch.getAttribute("aria-checked");
  check("toggle GMF convena (optimista + API)", before !== after, `${before} -> ${after}`);
  await page.close();
}

async function auditDialogs(context) {
  // Create dialog fields per type
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Nuevo método" }).click();
  await page.waitForSelector('[role="dialog"]');

  check("create: campo nombre", Boolean(await page.getByLabel("Nombre").count()));
  check("create: select moneda COP por defecto", (await page.getByLabel("Moneda").inputValue()) === "COP");
  check("create: tarjeta muestra últimos 4", Boolean(await page.getByLabel("Últimos 4 dígitos de la tarjeta").count()));
  check("create: tarjeta muestra día de corte", Boolean(await page.getByLabel("Día de corte").count()));
  check("create: tarjeta muestra límite/saldo", Boolean(await page.getByLabel("Límite de crédito").count()) && Boolean(await page.getByLabel("Saldo actual").count()));

  await page.getByRole("radio", { name: "Cuenta" }).click();
  await page.waitForTimeout(150);
  check("create: cuenta muestra banco", Boolean(await page.getByLabel("Banco").count()));
  check("create: cuenta muestra tipo", Boolean(await page.getByLabel("Tipo de cuenta").count()));

  await page.getByLabel("Tipo de cuenta").selectOption("SAVINGS");
  await page.waitForTimeout(150);
  check("create: cuenta de ahorros muestra switch GMF", Boolean(await page.getByLabel("Exenta de GMF").count()));

  await page.getByLabel("Tipo de cuenta").selectOption("CHECKING");
  await page.waitForTimeout(150);
  check("create: cuenta corriente oculta switch GMF", (await page.getByLabel("Exenta de GMF").count()) === 0);

  await page.getByRole("radio", { name: "Efectivo" }).click();
  await page.waitForTimeout(150);
  check("create: efectivo muestra monto", Boolean(await page.getByLabel("Monto en efectivo").count()));

  await page.keyboard.press("Escape");
  await page.close();
}

async function auditEmptyState(browser, emptyToken) {
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti, user }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify(user));
      localStorage.setItem("theme", "dark");
      const root = document.documentElement;
      if (root && !root.classList.contains("dark")) root.classList.add("dark");
    },
    { jti: emptyToken, user: { name: "QA Vacío", email: "qa_empty@test.local" } }
  );
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const hasEmpty = await page.evaluate(() => document.body.textContent?.includes("Aún no tienes métodos de pago"));
  const hasCreateCta = await page.getByRole("button", { name: "Crear método de pago" }).count();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check("estado vacío visible para usuario sin métodos", hasEmpty);
  check("estado vacío: CTA presente", hasCreateCta > 0);
  check("estado vacío: sin desborde", !overflow);
  await context.close();
}

async function seedMethods(token) {
  const pm = async (name, type, currency, details) =>
    api("/payment-methods", {
      method: "POST",
      body: { name, type, currency, details },
      token,
    });
  const bank = await pm("Bancolombia Cuenta principal", "BANK_ACCOUNT", "COP", {
    bank_name: "Bancolombia",
    account_number: "1234",
    account_type: "SAVINGS",
    current_balance: 8200000,
  });
  await api(`/payment-methods/${bank.id}/gmf-exempt`, {
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
  await pm("Efectivo en casa", "CASH", "COP", { amount: 250000 });
}

async function cleanupMethods(token) {
  const methods = await api("/payment-methods", { token });
  for (const method of methods) {
    await api("/payment-methods/" + method.id, { method: "DELETE", token }).catch(() => {});
  }
}

async function auditCud(browser, token) {
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti, user }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify(user));
      localStorage.setItem("theme", "dark");
      const root = document.documentElement;
      if (root && !root.classList.contains("dark")) root.classList.add("dark");
    },
    { jti: token, user: { name: "QA Capture", email: SEED_EMAIL } }
  );
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // CREATE via UI
  await page.goto(`${BASE_URL}/payment-methods`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Nuevo método" }).click();
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole("radio", { name: "Efectivo" }).click();
  await page.waitForTimeout(150);
  await page.getByLabel("Nombre").fill("Billetera digital");
  await page.getByLabel("Monto en efectivo").fill("350000");
  await page.getByRole("button", { name: "Crear método" }).click();
  await page.waitForSelector('text=Método de pago creado', { timeout: 10000 });
  check("create e2e: toast de éxito", true);
  await page.waitForTimeout(700);
  const createdRow = await page.evaluate(() =>
    [...document.querySelectorAll("div.group")].some((s) => s.textContent?.includes("Billetera digital"))
  );
  check("create e2e: nueva fila visible", createdRow);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const persisted = await page.evaluate(() => document.body.textContent?.includes("Billetera digital"));
  check("create e2e: persiste tras recarga", Boolean(persisted));

  // DELETE via UI
  await page.locator('button[aria-label="Eliminar Billetera digital"]').click();
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.waitForSelector('text=Método de pago eliminado', { timeout: 10000 });
  await page.waitForTimeout(700);
  const gone = await page.evaluate(() =>
    ![...document.querySelectorAll("div.group")].some((s) => s.textContent?.includes("Billetera digital"))
  );
  check("delete e2e: fila eliminada", gone);

  await context.close();
}

async function main() {
  const token = tokenFor(SEED_USER_ID);
  await cleanupMethods(token);
  await seedMethods(token);
  const emptyToken = tokenFor(EMPTY_USER_ID);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti, user }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify(user));
      localStorage.setItem("theme", "dark");
      const root = document.documentElement;
      if (root && !root.classList.contains("dark")) root.classList.add("dark");
    },
    { jti: token, user: { name: "QA Capture", email: SEED_EMAIL } }
  );

  await auditViewport(context, "desktop", { width: 1440, height: 900 });
  await auditViewport(context, "mobile", { width: 390, height: 844 });
  await auditDialogs(context);
  await auditGmfToggle(context);
  await auditCud(browser, token);
  await auditEmptyState(browser, emptyToken);

  await browser.close();
  await cleanupMethods(token);
  console.log("---");
  console.log("QA audit finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});