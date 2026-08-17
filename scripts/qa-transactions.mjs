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
let token = SEED_USER_ID ? tokenFor(SEED_USER_ID) : null;

function assert(condition, message) {
  if (!condition) {
    throw new Error("ASSERT FAIL: " + message);
  }
  console.log("  ok -", message);
}

async function seed() {
  if (!token) {
    const reg = await api("/users", {
      method: "POST",
      body: {
        username: `qa_${stamp}`,
        name: "QA Usuario",
        email,
        password,
        phone: "5551234567",
      },
    }).catch((err) => {
      console.log("register failed (continuing):", err.message);
      return null;
    });
    if (reg) console.log("registered user", reg.id);

    const session = await api("/auth/login", { method: "POST", body: { email, password } });
    token = session.token;
  } else {
    const history = await api("/transactions/history?limit=200", { token }).catch(() => ({ items: [] }));
    for (const t of history.items ?? []) {
      await api("/transactions/" + t.id, { method: "DELETE", token }).catch(() => {});
    }
    const methods = await api("/payment-methods", { token }).catch(() => []);
    for (const m of methods) {
      await api("/payment-methods/" + m.id, { method: "DELETE", token }).catch(() => {});
    }
    const categories = await api("/categories", { token }).catch(() => []);
    for (const c of categories) {
      await api("/categories/" + c.id, { method: "DELETE", token }).catch(() => {});
    }
  }

  const cat = async (name, type) => {
    const category = await api("/categories", { method: "POST", body: { name, type }, token });
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
  const tx = async (transaction) => {
    const item = await api("/transactions/manual", { method: "POST", body: transaction, token });
    created.transactions.push(item.id);
    return item;
  };

  const comida = await cat("Comida", "expense");
  const transporte = await cat("Transporte", "expense");
  const vivienda = await cat("Vivienda", "expense");
  const otros = await cat("Otros", "expense");
  await cat("Salario", "income");
  await cat("Ahorros", "transfer");

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

  await tx({ amount: 500, description: "Renta de departamento", date: "2026-08-01T00:00:00", type: "EXPENSE", categoryId: vivienda.id, paymentMethodId: nacional.id });
  await tx({ amount: 85.4, description: "Supermercado", date: "2026-08-13T00:00:00", type: "EXPENSE", categoryId: comida.id, paymentMethodId: visa.id });
  await tx({ amount: 12, description: "Uber", date: "2026-08-12T00:00:00", type: "EXPENSE", categoryId: transporte.id, paymentMethodId: efectivo.id });
  await tx({ amount: 34.7, description: "Restaurante", date: "2026-08-15T00:00:00", type: "EXPENSE", categoryId: comida.id, paymentMethodId: visa.id });
  await tx({ amount: 18.5, description: "Cine", date: "2026-08-10T00:00:00", type: "EXPENSE", categoryId: otros.id, paymentMethodId: efectivo.id });
  await tx({ amount: 1800, description: "Salario", date: "2026-08-01T00:00:00", type: "INCOME", categoryId: (await cat("SalarioX", "income")).id, paymentMethodId: nacional.id });
  await tx({ amount: 150, description: "Retiro a efectivo", date: "2026-08-03T00:00:00", type: "TRANSFER", categoryId: (await cat("AhorrosX", "transfer")).id, sourcePaymentMethodId: nacional.id, destinationPaymentMethodId: efectivo.id });
  return { visa };
}

async function cleanup() {
  for (const id of created.transactions) await api("/transactions/" + id, { method: "DELETE", token }).catch(() => {});
  for (const id of created.paymentMethods) await api("/payment-methods/" + id, { method: "DELETE", token }).catch(() => {});
  for (const id of created.categories) await api("/categories/" + id, { method: "DELETE", token }).catch(() => {});
  if (!SEED_USER_ID) {
    const session = await api("/auth/login", { method: "POST", body: { email, password } }).catch(() => null);
    if (session?.user?.id) await api("/users/" + session.user.id, { method: "DELETE" }).catch(() => {});
  }
}

let browser;

try {
  await seed();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ jti, email }) => {
      localStorage.setItem("fa_token", jti);
      localStorage.setItem("fa_user", JSON.stringify({ name: "QA Usuario", email }));
      localStorage.setItem("theme", "dark");
      const root = document.documentElement;
      if (root && !root.classList.contains("dark")) root.classList.add("dark");
    },
    { jti: token, email }
  );

  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1440, height: 900 });
  await desktopPage.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await desktopPage.getByText("Renta de departamento").first().waitFor({ timeout: 15000 });

  const bodyText = await desktopPage.evaluate(() => document.body.innerText);
  console.log("== List: content checks ==");
  for (const snippet of [
    "Renta de departamento",
    "Supermercado",
    "Salario",
    "Retiro a efectivo",
    "$1,800.00",
    "$650.60",
    "$150.00",
    "$1,149.40",
    "7 de 7 movimientos",
  ]) {
    assert(bodyText.includes(snippet), `texto contiene "${snippet}"`);
  }

  console.log("== List: layout / a11y ==");
  const overflow = await desktopPage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  assert(!overflow, "sin desborde horizontal (desktop)");

  const namelessButtons = await desktopPage.evaluate(() =>
    Array.from(document.querySelectorAll("button")).filter((b) => {
      const label = b.getAttribute("aria-label");
      return !label && !b.textContent.trim();
    }).length
  );
  assert(namelessButtons === 0, `todos los botones tienen nombre accesible (sin nombre: ${namelessButtons})`);

  const options = await desktopPage.getByLabel("Tipo").locator("option").allTextContents();
  assert(["Todos los tipos", "Ingresos", "Gastos", "Transferencias"].every((o) => options.includes(o)), "filtro de tipo con todas las opciones");

  // Filter by type = Gastos
  await desktopPage.getByLabel("Tipo").selectOption("EXPENSE");
  await desktopPage.getByText("Supermercado").first().waitFor({ timeout: 10000 });
  await desktopPage.waitForTimeout(400);
  assert(
    (await desktopPage.locator('button[aria-label="Editar Salario"]').count()) === 0 &&
      (await desktopPage.locator('button[aria-label="Editar Retiro a efectivo"]').count()) === 0 &&
      (await desktopPage.locator('button[aria-label="Editar Renta de departamento"]').count()) === 1,
    "filtro Gastos excluye ingresos/transferencias"
  );
  await desktopPage.getByLabel("Tipo").selectOption("TRANSFER");
  await desktopPage.waitForTimeout(600);
  assert(
    (await desktopPage.locator('button[aria-label="Editar Retiro a efectivo"]').count()) === 1 &&
      (await desktopPage.locator('button[aria-label="Editar Salario"]').count()) === 0,
    "filtro Transferencias muestra solo transferencias"
  );

  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await mobilePage.getByText("Renta de departamento").first().waitFor({ timeout: 15000 });
  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  assert(!mobileOverflow, "sin desborde horizontal (mobile 390)");
  await mobilePage.close();

  console.log("== Create via UI ==");
  const newPage = await context.newPage();
  await newPage.setViewportSize({ width: 1280, height: 1200 });
  await newPage.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await newPage.getByRole("button", { name: "Nueva transacción" }).click();
  await newPage.waitForSelector('[role="dialog"]');
  const createDialog = newPage.locator('[role="dialog"]');
  await createDialog.getByLabel("Categoría").waitFor({ timeout: 15000 });

  // TRANSFER segment should reveal origin/destination
  await createDialog.getByRole("radio", { name: "Transferencia" }).click();
  await createDialog.getByLabel("Desde").waitFor();
  await createDialog.getByLabel("Hacia").waitFor();
  assert(true, "segmento Transferencia muestra origen y destino");
  await createDialog.getByRole("radio", { name: "Gasto" }).click();

  const categoryValue = await createDialog
    .getByLabel("Categoría")
    .locator("option")
    .evaluateAll((opts) => {
      const first = opts.find((o) => o.value && o.value !== "default");
      return first ? first.value : "";
    });

  await createDialog.getByLabel("Descripción").fill("QA creada por UI");
  await createDialog.getByLabel("Importe").fill("77.77");
  await createDialog.getByLabel("Categoría").selectOption(categoryValue);
  await createDialog.getByLabel("Método de pago").selectOption({ index: 1 });
  await createDialog.getByRole("button", { name: "Crear transacción" }).click();
  await newPage.locator('[role="dialog"]').waitFor({ state: "detached", timeout: 15000 });
  await newPage.getByText("QA creada por UI").first().waitFor({ timeout: 15000 });
  const createdToast = await newPage.locator('[role="status"]').allTextContents();
  assert(createdToast.some((t) => t.includes("Transacción creada")), "toast de creación visible");
  assert(true, "lista muestra la transacción creada");

  console.log("== Edit via UI ==");
  const editButton = newPage.locator('button[aria-label^="Editar QA creada por UI"]');
  await editButton.click();
  await newPage.waitForSelector('[role="dialog"]');
  await newPage.getByLabel("Importe").fill("88.88");
  await newPage.getByRole("button", { name: "Guardar cambios" }).click();
  await newPage.getByText("$88.88").first().waitFor({ timeout: 15000 });
  const editToast = await newPage.locator('[role="status"]').allTextContents();
  assert(editToast.some((t) => t.includes("Transacción actualizada")), "toast de actualización visible y monto reflejado");

  console.log("== Delete via UI ==");
  const deleteButton = newPage.locator('button[aria-label^="Eliminar QA creada por UI"]');
  await deleteButton.click();
  await newPage.waitForSelector('[role="dialog"]');
  await newPage.getByRole("button", { name: "Eliminar", exact: true }).click();
  await newPage.getByText("QA creada por UI", { exact: true }).waitFor({ state: "detached", timeout: 15000 });
  const delToast = await newPage.locator('[role="status"]').allTextContents();
  assert(delToast.some((t) => t.includes("Transacción eliminada")), "toast de eliminación visible y fila removida");

  await newPage.close();
  await desktopPage.close();
  console.log("ALL QA CHECKS PASSED");
} finally {
  if (browser) await browser.close().catch(() => {});
  await cleanup().catch((err) => console.error("cleanup error:", err.message));
}