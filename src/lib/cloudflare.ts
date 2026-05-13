export async function generateStreamToken(cfVideoId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 7200; // 2 hours
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${cfVideoId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exp }),
    }
  );
  if (!res.ok) throw new Error(`CF token error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.result.token;
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
