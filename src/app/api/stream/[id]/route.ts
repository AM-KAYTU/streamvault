import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Instead of proxying (Vercel → CDN → Vercel → Browser = double bandwidth + latency),
// we validate the PIN then redirect the browser straight to the CDN URL.
// The browser streams directly from Bunny at full CDN speed with no proxy bottleneck.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pin = req.nextUrl.searchParams.get("pin")?.toUpperCase().replace(/-/g, "");

  if (!pin) return new NextResponse("Unauthorized", { status: 401 });

  const purchase = await prisma.packPurchase.findUnique({ where: { pin } });
  if (!purchase) return new NextResponse("Invalid PIN", { status: 401 });

  const secondsLeft = purchase.secondsTotal - purchase.secondsUsed;
  if (secondsLeft <= 0) return new NextResponse("Watch time exhausted", { status: 403 });

  const video = await prisma.video.findUnique({ where: { id: params.id, published: true } });
  if (!video) return new NextResponse("Not found", { status: 404 });

  // Redirect browser directly to the CDN — no proxy, no buffering
  return NextResponse.redirect(video.videoUrl, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
