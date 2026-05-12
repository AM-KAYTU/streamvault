import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin")?.toUpperCase().replace(/-/g, "");
  if (!pin || pin.length !== 6) {
    return NextResponse.json({ valid: false, error: "Invalid PIN" }, { status: 400 });
  }

  const purchase = await prisma.packPurchase.findUnique({
    where: { pin },
    include: { pack: true },
  });

  if (!purchase) {
    return NextResponse.json({ valid: false, error: "PIN not found" }, { status: 404 });
  }

  const secondsLeft = purchase.secondsTotal - purchase.secondsUsed;
  const minutesLeft = Math.floor(secondsLeft / 60);

  return NextResponse.json({
    valid: secondsLeft > 0,
    exhausted: secondsLeft <= 0,
    secondsLeft,
    minutesLeft,
    secondsTotal: purchase.secondsTotal,
    minutesTotal: Math.floor(purchase.secondsTotal / 60),
    packName: purchase.pack.name,
  });
}
