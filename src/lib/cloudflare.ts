import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

export async function generateStreamToken(cfVideoId: string): Promise<string> {
  const pem = process.env.CF_STREAM_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const privateKey = createPrivateKey({ key: pem, format: "pem" });

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: process.env.CF_STREAM_KEY_ID! })
    .setSubject(cfVideoId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(privateKey);
}

export async function createDirectUpload(): Promise<{ uid: string; uploadUrl: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowedOrigins = appUrl ? [new URL(appUrl).hostname] : [];

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 21600,
        requireSignedURLs: true,
        allowedOrigins,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CF upload creation failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { uid: data.result.uid, uploadUrl: data.result.uploadURL };
}
