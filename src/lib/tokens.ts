import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.TOKEN_SECRET || "fallback-secret-change-in-production"
);

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-admin-secret-change-in-production"
);

export interface WatchTokenPayload {
  videoId: string | null; // null = subscription (all videos)
  email: string;
  type: "single" | "subscription";
  purchaseId: string;
}

export async function signWatchToken(payload: WatchTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2y")
    .sign(secret);
}

export async function verifyWatchToken(
  token: string
): Promise<WatchTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as WatchTokenPayload;
  } catch {
    return null;
  }
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
