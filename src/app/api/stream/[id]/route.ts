import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStreamToken } from "@/lib/cloudflare";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pin = req.nextUrl.searchParams.get("pin")?.toUpperCase().replace(/-/g, "");
  if (!pin) return new NextResponse("Unauthorized", { status: 401 });

  const purchase = await prisma.packPurchase.findUnique({ where: { pin } });
  if (!purchase) return new NextResponse("Invalid PIN", { status: 401 });

  if (purchase.secondsTotal - purchase.secondsUsed <= 0)
    return new NextResponse("Watch time exhausted", { status: 403 });

  const video = await prisma.video.findUnique({ where: { id: params.id, published: true } });
  if (!video?.cfVideoId) return new NextResponse("Not found", { status: 404 });

  const token = await generateStreamToken(video.cfVideoId);
  const streamUrl = `https://customer-${process.env.CF_CUSTOMER_CODE}.cloudflarestream.com/${token}/manifest/video.m3u8`;

  return NextResponse.json(
    { streamUrl },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
