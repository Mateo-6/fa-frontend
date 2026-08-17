import { chromium } from "playwright";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const OUT_DIR = resolve(process.cwd(), ".impeccable/review");

const mockSummary = {
  data: {
    summary: {
      totalBalance: 2847.5,
      totalIncome: 4200,
      totalExpenses: 1352.5,
      availableBalance: 1547.5,
    },
    recentTransactions: [
      {
        id: "t1",
        userId: "u1",
        amount: 85.4,
        description: "Supermercado La Torre",
        date: "2026-08-14T10:00:00Z",
        type: "EXPENSE",
        category: { id: "c1", name: "Alimentación" },
        isRecurring: false,
      },
      {
        id: "t2",
        userId: "u1",
        amount: 1200,
        description: "Salario mensual",
        date: "2026-08-01T08:00:00Z",
        type: "INCOME",
        category: { id: "c2", name: "Salario" },
        isRecurring: false,
      },
      {
        id: "t3",
        userId: "u1",
        amount: 45,
        description: "Netflix + Spotify",
        date: "2026-08-10T18:30:00Z",
        type: "EXPENSE",
        category: { id: "c3", name: "Suscripciones" },
        isRecurring: true,
      },
      {
        id: "t4",
        userId: "u1",
        amount: 320,
        description: "Transporte y gasolina",
        date: "2026-08-08T14:15:00Z",
        type: "EXPENSE",
        category: { id: "c4", name: "Transporte" },
        isRecurring: false,
      },
    ],
    upcomingPayments: [
      {
        id: "r1",
        userId: "u1",
        name: "Renta departamento",
        amount: 850,
        currency: "USD",
        categoryId: "c5",
        paymentMethodId: "pm1",
        frequency: "MONTHLY",
        payDay: 1,
        startDate: "2026-01-01T00:00:00Z",
        nextPaymentDate: "2026-09-01T00:00:00Z",
        isActive: true,
      },
      {
        id: "r2",
        userId: "u1",
        name: "Gimnasio",
        amount: 35,
        currency: "USD",
        categoryId: "c6",
        paymentMethodId: "pm2",
        frequency: "MONTHLY",
        payDay: 15,
        startDate: "2026-01-15T00:00:00Z",
        nextPaymentDate: "2026-08-20T00:00:00Z",
        isActive: true,
      },
    ],
    creditCards: [
      {
        id: "cc1",
        name: "Visa Signature",
        lastFourDigits: "4821",
        currency: "USD",
        currentBalance: 1250,
        creditLimit: 5000,
        availableCredit: 3750,
        utilizationPercentage: 25,
        daysUntilCutOff: 5,
        daysUntilPayment: 20,
        cutOffDay: 20,
        paymentDay: 10,
      },
      {
        id: "cc2",
        name: "Mastercard Gold",
        lastFourDigits: "7392",
        currency: "USD",
        currentBalance: 890,
        creditLimit: 3000,
        availableCredit: 2110,
        utilizationPercentage: 29.7,
        daysUntilCutOff: 12,
        daysUntilPayment: 27,
        cutOffDay: 25,
        paymentDay: 15,
      },
    ],
  },
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.route("http://localhost:3000/summary", (route) => {
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(mockSummary),
  });
});

await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("fa_token", "mock-token-for-critique");
  localStorage.setItem("fa_user", JSON.stringify({ id: "u1", email: "usuario@ejemplo.com", name: "Usuario de prueba" }));
});

await page.goto(`${BASE_URL}/summary`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const screenshotPath = resolve(OUT_DIR, "summary-critique.png");
await page.screenshot({ path: screenshotPath, fullPage: false });

const detectScriptPath = resolve(
  process.cwd(),
  ".claude/skills/impeccable/scripts/detector/detect-antipatterns-browser.js"
);
const detectScript = readFileSync(detectScriptPath, "utf-8");
await page.addScriptTag({ content: detectScript });
await page.waitForFunction(() => typeof window.impeccableDetect === "function", { timeout: 5000 });
const findings = await page.evaluate(() => window.impeccableDetect());

await context.close();
await browser.close();

console.log(JSON.stringify({ screenshotPath, findings }, null, 2));
