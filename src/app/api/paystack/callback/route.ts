import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { generatePin } from "@/lib/pin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!reference) return NextResponse.redirect(`${appUrl}/credits?error=no_reference`);

  try {
    const result = await verifyTransaction(reference);
    if (result.data.status !== "success") {
      return NextResponse.redirect(`${appUrl}/credits?error=payment_failed`);
    }

    // Idempotency
    const existing = await prisma.packPurchase.findUnique({ where: { paystackRef: reference } });
    if (existing) {
      return NextResponse.redirect(`${appUrl}/credits/success?pin=${existing.pin}`);
    }

    const meta = result.data.metadata as { packId?: string };

    const pack = await prisma.creditPack.findUnique({ where: { id: meta.packId } });
    if (!pack) return NextResponse.redirect(`${appUrl}/credits?error=pack_not_found`);

    // Generate unique PIN
    let pin = generatePin();
    let attempts = 0;
    while (await prisma.packPurchase.findUnique({ where: { pin } }) && attempts < 10) {
      pin = generatePin();
      attempts++;
    }

    await prisma.packPurchase.create({
      data: {
        pin,
        secondsTotal: pack.minutes * 60,
        paystackRef: reference,
        packId: pack.id,
      },
    });

    return NextResponse.redirect(`${appUrl}/credits/success?pin=${pin}`);
  } catch (err) {
    console.error("[callback]", err);
    return NextResponse.redirect(`${appUrl}/credits?error=verification_failed`);
  }
}
