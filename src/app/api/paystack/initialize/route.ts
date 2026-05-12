import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json({ error: "packId required" }, { status: 400 });
    }

    const pack = await prisma.creditPack.findUnique({ where: { id: packId, active: true } });
    if (!pack) {
      return NextResponse.json({ error: "Credit pack not found" }, { status: 404 });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const reference = `sv_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const amount = Math.round(pack.price * 100); // pesewas

    const result = await initializeTransaction({
      email: "pay@streamvault.app", // anonymous — we don't collect email
      amount,
      reference,
      callback_url: `${appUrl}/api/paystack/callback`,
      metadata: {
        packId: pack.id,
        packName: pack.name,
        minutes: pack.minutes,
        custom_fields: [
          { display_name: "Pack", variable_name: "pack_name", value: pack.name },
          { display_name: "Watch Time", variable_name: "minutes", value: `${pack.minutes} minutes` },
        ],
      },
    });

    return NextResponse.json({ authorization_url: result.data.authorization_url });
  } catch (err: unknown) {
    console.error("[paystack/initialize]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
