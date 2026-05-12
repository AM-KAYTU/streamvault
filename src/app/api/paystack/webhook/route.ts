import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { generatePin } from "@/lib/pin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, metadata } = event.data;
    const meta = metadata as { packId?: string };

    const exists = await prisma.packPurchase.findUnique({ where: { paystackRef: reference } });
    if (exists || !meta?.packId) return NextResponse.json({ received: true });

    const pack = await prisma.creditPack.findUnique({ where: { id: meta.packId } });
    if (!pack) return NextResponse.json({ received: true });

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
  }

  return NextResponse.json({ received: true });
}
