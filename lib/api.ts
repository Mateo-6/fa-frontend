import { clearSession, getRefreshToken, updateAccessToken } from "@/lib/session";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    username?: string;
    phone?: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export interface CategorySnapshot {
  id: string;
  name: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  subtype?: string | null;
  category: CategorySnapshot;
  paymentMethodId?: string;
  sourcePaymentMethodId?: string;
  destinationPaymentMethodId?: string;
  isRecurring: boolean;
  recurringExpenseId?: string;
  budgetAmount?: number | null;
  gmfAmount?: number;
  cardPaymentDetails?: CardPaymentDetails | null;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  categoryId: string;
  paymentMethodId: string;
  frequency: "WEEKLY" | "MONTHLY" | "YEARLY";
  payDay: number;
  startDate: string;
  nextPaymentDate: string;
  isActive: boolean;
}

export interface CreditCardSummary {
  id: string;
  name: string;
  lastFourDigits: string;
  currency: string;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercentage: number;
  daysUntilCutOff: number;
  daysUntilPayment: number;
  cutOffDay: number;
  paymentDay: number;
}

export type BillingPeriodStatus = "OPEN" | "CLOSED" | "PAID" | "PARTIALLY_PAID";

export interface CardPaymentDetails {
  creditCardId: string;
  isFullPayment: boolean;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface BillingPeriod {
  startDate: string;
  endDate: string;
  totalSpent: number;
  transactionCount: number;
  transactions: Transaction[];
  isPaid: boolean;
  paymentAmount: number | null;
  status: BillingPeriodStatus;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  total: number;
}

export interface BillingPeriodDetail extends BillingPeriod {
  categoryBreakdown: CategoryBreakdown[];
}

export interface CreditCardDetail extends CreditCardSummary {
  currentPeriodSummary: BillingPeriod;
  recentPayments: Transaction[];
  billingPeriods: BillingPeriod[];
}

export interface PayCardPayload {
  sourceAccountId: string;
  amount: number;
  date: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
}

export interface SummaryData {
  summary: FinancialSummary;
  recentTransactions: Transaction[];
  upcomingPayments: RecurringExpense[];
  creditCards: CreditCardSummary[];
}

export type CategoryType = "income" | "expense" | "transfer";

export interface UpdateUserPayload {
  username?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export async function getUser(id: string): Promise<User> {
  return apiGet<User>(`/users/${id}`);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return apiMutate<User>(`/users/${id}`, "PUT", payload);
}

/** Invalidates the session on the server and always clears local auth data. */
export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    await apiRequest<void>("/auth/logout", { refreshToken });
  } finally {
    clearSession();
  }
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
  userId: string;
}

export type PaymentMethodType = "CREDIT_CARD" | "BANK_ACCOUNT" | "CASH";

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  currency: string;
  details: {
    bank_name?: string;
    account_number?: string;
    account_type?: string;
    current_balance?: number;
    is_gmf_exempt?: boolean;
    amount?: number;
    card_number?: string;
    cut_off_day?: number;
    payment_day?: number;
    credit_limit?: number;
  };
}

export interface CreatePaymentMethodPayload {
  name: string;
  type: PaymentMethodType;
  currency: string;
  details: PaymentMethod["details"];
}

export type UpdatePaymentMethodPayload = Partial<CreatePaymentMethodPayload>;

export interface TransactionHistoryParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType | TransactionType[];
  categoryId?: string | string[];
  paymentMethodId?: string | string[];
  excludeCardPayments?: boolean;
  limit?: number;
  offset?: number;
}

export interface TransactionHistoryResult {
  items: Transaction[];
  total: number;
}

export interface CreateTransactionPayload {
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  paymentMethodId?: string;
  sourcePaymentMethodId?: string;
  destinationPaymentMethodId?: string;
  budgetAmount?: number | null;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringPayDay?: number;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface AmiDetectedField<T> {
  value: T | null;
  confidence: "high" | "low" | null;
  detected: boolean;
}

export interface ParseIntentResponse {
  parseId: string;
  detectedFields: {
    amount: AmiDetectedField<number>;
    description: AmiDetectedField<string>;
    date: AmiDetectedField<string>;
    type: AmiDetectedField<string>;
    categoryId: AmiDetectedField<string>;
    paymentMethodId: AmiDetectedField<string>;
    isRecurring: AmiDetectedField<boolean>;
    recurringFrequency: AmiDetectedField<string>;
    recurringPayDay: AmiDetectedField<number>;
    applyToBudget: AmiDetectedField<boolean>;
    budgetAmountInput: AmiDetectedField<number>;
    transferSourceId: AmiDetectedField<string>;
    transferDestinationId: AmiDetectedField<string>;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No hay token de refresco disponible");
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "La sesión ha expirado");
    }

    const result = data.data as { token?: string } | undefined;
    if (!result?.token) {
      throw new Error("Respuesta de refresco inválida");
    }

    updateAccessToken(result.token);
    return result.token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function apiError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

async function requestWithAuth<T>(
  path: string,
  options: { method: string; body?: unknown }
): Promise<T> {
  const run = (): Promise<Response> => {
    const token = getToken();
    return fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await run();

  if (response.status === 401 && !path.startsWith("/auth/")) {
    try {
      await refreshAccessToken();
      response = await run();
    } catch {
      clearSession();
      throw apiError(401, "Tu sesión ha expirado. Inicia sesión nuevamente.");
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || "Ocurrió un error. Intenta de nuevo.";
    throw apiError(response.status, message);
  }

  return data.data as T;
}

async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  return requestWithAuth<T>(path, { method: "POST", body });
}

async function apiGet<T>(path: string): Promise<T> {
  return requestWithAuth<T>(path, { method: "GET" });
}

async function apiMutate<T>(path: string, method: "PUT" | "DELETE" | "PATCH", body?: unknown): Promise<T> {
  return requestWithAuth<T>(path, { method, body });
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", credentials);
}

export async function register(data: RegisterData): Promise<User> {
  return apiRequest<User>("/users", data);
}

export async function getSummary(): Promise<SummaryData> {
  return apiGet<SummaryData>("/summary");
}

function appendSearchParam(
  search: URLSearchParams,
  key: string,
  value: string | string[] | undefined
): void {
  if (value === undefined || value === null || value === "") return;
  const values = Array.isArray(value) ? value : [value];
  for (const v of values) {
    if (v) search.append(key, v);
  }
}

export async function getTransactionHistory(
  params: TransactionHistoryParams = {}
): Promise<TransactionHistoryResult> {
  const search = new URLSearchParams();
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  appendSearchParam(search, "type", params.type);
  appendSearchParam(search, "categoryId", params.categoryId);
  appendSearchParam(search, "paymentMethodId", params.paymentMethodId);
  if (params.excludeCardPayments) search.set("excludeCardPayments", "true");
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  return apiGet<TransactionHistoryResult>(`/transactions/history${query ? `?${query}` : ""}`);
}

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  return apiGet<Category[]>(`/categories${type ? `?type=${type}` : ""}`);
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
}

export type UpdateCategoryPayload = Partial<
  Pick<CreateCategoryPayload, "name" | "description" | "type" | "color" | "icon">
>;

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  return apiRequest<Category>("/categories", payload);
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<Category> {
  return apiMutate<Category>(`/categories/${id}`, "PUT", payload);
}

export async function deleteCategory(id: string): Promise<void> {
  return apiMutate<void>(`/categories/${id}`, "DELETE");
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiGet<PaymentMethod[]>("/payment-methods");
}

export async function createPaymentMethod(payload: CreatePaymentMethodPayload): Promise<PaymentMethod> {
  return apiRequest<PaymentMethod>("/payment-methods", payload);
}

export async function updatePaymentMethod(
  id: string,
  payload: UpdatePaymentMethodPayload
): Promise<PaymentMethod> {
  return apiMutate<PaymentMethod>(`/payment-methods/${id}`, "PUT", payload);
}

export async function deletePaymentMethod(id: string): Promise<void> {
  return apiMutate<void>(`/payment-methods/${id}`, "DELETE");
}

export async function togglePaymentMethodGmfExempt(id: string, isExempt: boolean): Promise<PaymentMethod> {
  return apiMutate<PaymentMethod>(`/payment-methods/${id}/gmf-exempt`, "PATCH", { is_exempt: isExempt });
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return apiRequest<Transaction>("/transactions/manual", payload);
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  return apiMutate<Transaction>(`/transactions/${id}`, "PUT", payload);
}

export async function parseTransactionIntent(text: string): Promise<ParseIntentResponse> {
  return apiRequest<ParseIntentResponse>("/transactions/parse-intent", { text });
}

export async function deleteTransaction(id: string): Promise<void> {
  return apiMutate<void>(`/transactions/${id}`, "DELETE");
}

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export type BudgetResultado = "CUMPLIDO" | "EXCEDIDO" | "EN_LIMITE";

export interface Budget {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  /** ObjectId of the category this budget applies to. null means global (all expense categories). */
  categoryId: string | null;
  startDate: string;
  endDate: string;
  /** Running total of expenses within this budget's period and category. */
  spent: number;
  isActive: boolean;
  rollover: boolean;
  /** Percentage thresholds at which push alerts are sent. Default: [80, 100]. */
  alertThresholds: number[];
  alertsSent: number[];
  createdAt?: string;
  updatedAt?: string;
  remaining: number;
  percentage: number;
  resultado?: BudgetResultado | null;
}

export interface CreateBudgetPayload {
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  categoryId?: string | null;
  startDate?: string;
  rollover?: boolean;
  alertThresholds?: number[];
}

/** All budget fields are mutable after creation. */
export type UpdateBudgetPayload = Partial<
  Pick<
    CreateBudgetPayload,
    "name" | "amount" | "currency" | "period" | "categoryId" | "startDate" | "alertThresholds" | "rollover"
  >
>;

export async function getBudgets(
  params: { isActive?: boolean; includeExpired?: boolean } = {}
): Promise<Budget[]> {
  const search = new URLSearchParams();
  if (params.isActive !== undefined) search.set("isActive", String(params.isActive));
  if (params.includeExpired) search.set("includeExpired", "true");
  const query = search.toString();
  return apiGet<Budget[]>(`/budgets${query ? `?${query}` : ""}`);
}

export async function getBudget(id: string): Promise<Budget> {
  return apiGet<Budget>(`/budgets/${id}`);
}

export async function getBudgetHistory(): Promise<Budget[]> {
  return apiGet<Budget[]>("/budgets/history");
}

export async function getBudgetSummary(): Promise<Budget[]> {
  return apiGet<Budget[]>("/budgets/summary");
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  return apiRequest<Budget>("/budgets", payload);
}

export async function updateBudget(id: string, payload: UpdateBudgetPayload): Promise<Budget> {
  return apiMutate<Budget>(`/budgets/${id}`, "PUT", payload);
}

export async function recalculateBudget(id: string): Promise<Budget> {
  return apiMutate<Budget>(`/budgets/${id}/recalculate`, "PATCH");
}

/** Soft-deactivates a budget: moves it to history without deleting it. */
export async function deactivateBudget(id: string): Promise<void> {
  return apiMutate<void>(`/budgets/${id}/finalize`, "PATCH");
}

export async function getCreditCards(): Promise<CreditCardSummary[]> {
  return apiGet<CreditCardSummary[]>("/credit-cards");
}

export async function getCreditCardDetail(id: string): Promise<CreditCardDetail> {
  return apiGet<CreditCardDetail>(`/credit-cards/${id}`);
}

export async function getCreditCardStatements(id: string): Promise<BillingPeriod[]> {
  return apiGet<BillingPeriod[]>(`/credit-cards/${id}/statements`);
}

export async function getCreditCardStatementDetail(
  id: string,
  periodStart: string
): Promise<BillingPeriodDetail> {
  return apiGet<BillingPeriodDetail>(`/credit-cards/${id}/statements/${periodStart}`);
}

export async function payCreditCard(id: string, payload: PayCardPayload): Promise<Transaction> {
  return apiRequest<Transaction>(`/credit-cards/${id}/pay`, payload);
}

export async function getCreditCardPayments(id: string): Promise<Transaction[]> {
  return apiGet<Transaction[]>(`/credit-cards/${id}/payments`);
}

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
}

export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<PaginatedNotifications> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  return apiGet<PaginatedNotifications>(`/notifications${query ? `?${query}` : ""}`);
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return apiMutate<Notification>(`/notifications/${id}/read`, "PATCH");
}

/**
 * Opens a Server-Sent Events stream that delivers new notifications in real time.
 * Uses fetch (not EventSource) so the Authorization header can be sent, and
 * reconnects automatically with exponential backoff on failures or on session
 * refresh. Returns an unsubscribe function that closes the stream.
 *
 * @param {function} onNotification Callback invoked for each delivered notification.
 * @returns {() => void} Cleanup function to close the stream.
 */
export function subscribeNotificationsStream(
  onNotification: (notification: Notification) => void
): () => void {
  let aborted = false;
  let retryDelay = 1000;
  const controller = new AbortController();

  const handleEvent = (rawEvent: string) => {
    let data = "";
    for (const line of rawEvent.split("\n")) {
      if (line.startsWith("data:")) {
        data += line.slice(5).trim() + "\n";
      }
    }
    if (!data.trim()) return;
    try {
      onNotification(JSON.parse(data) as Notification);
    } catch {
      /* ignore malformed payloads */
    }
  };

  const scheduleRetry = () => {
    if (aborted) return;
    const delay = retryDelay;
    retryDelay = Math.min(retryDelay * 2, 5000);
    setTimeout(connect, delay);
  };

  const connect = async () => {
    if (aborted) return;

    const token = getToken();
    if (!token) {
      scheduleRetry();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        if (response.status === 401) {
          await refreshAccessToken();
        }
        scheduleRetry();
        return;
      }

      retryDelay = 1000;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          handleEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      /* network errors fall through to reconnect */
    }

    scheduleRetry();
  };

  connect();

  return () => {
    aborted = true;
    controller.abort();
  };
}