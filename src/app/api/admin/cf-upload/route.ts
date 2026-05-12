import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/tokens";
import { createDirectUpload } from "@/lib/cloudflare";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return !!token && (await verifyAdminToken(token));
}

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { uid, uploadUrl } = await createDirectUpload();
  return NextResponse.json({ uid, uploadUrl });
}
