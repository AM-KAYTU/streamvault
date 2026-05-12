const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

async function paystackRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack request failed");
  return data;
}

export interface InitializeParams {
  email: string;
  amount: number; // in kobo/pesewas/cents
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
  plan?: string;
}

export interface InitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction(
  params: InitializeParams
): Promise<InitializeResponse> {
  return paystackRequest<InitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface VerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    metadata: Record<string, unknown>;
    customer: { email: string };
    plan?: { plan_code: string; name: string };
    subscription?: { subscription_code: string; token: string };
  };
}

export async function verifyTransaction(reference: string): Promise<VerifyResponse> {
  return paystackRequest<VerifyResponse>(`/transaction/verify/${reference}`);
}

export interface CreatePlanResponse {
  status: boolean;
  data: { plan_code: string; name: string; amount: number; interval: string };
}

export async function getOrCreatePlan(
  name: string,
  amount: number,
  interval: "monthly" | "annually"
): Promise<string> {
  // List existing plans and find by name
  const list = await paystackRequest<{
    status: boolean;
    data: Array<{ plan_code: string; name: string }>;
  }>("/plan");
  const existing = list.data.find((p) => p.name === name);
  if (existing) return existing.plan_code;

  const created = await paystackRequest<CreatePlanResponse>("/plan", {
    method: "POST",
    body: JSON.stringify({ name, amount, interval }),
  });
  return created.data.plan_code;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const { createHmac } = require("crypto") as typeof import("crypto");
  const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  return hash === signature;
}
