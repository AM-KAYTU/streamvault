import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called every 15s during playback — deducts watch time from PIN balance
export async function POST(req: NextRequest) {
  try {
    const { videoId, pin: rawPin, seconds } = await req.json();
    const pin = rawPin?.toUpperCase().replace(/-/g, "");
    if (!videoId || !pin || !seconds) return NextResponse.json({ ok: false });

    // Atomically deduct seconds — never go below 0
    const purchase = await prisma.packPurchase.findUnique({ where: { pin } });
    if (!purchase) return NextResponse.json({ ok: false, error: "Invalid PIN" });

    const secondsLeft = purchase.secondsTotal - purchase.secondsUsed;
    if (secondsLeft <= 0) {
      return NextResponse.json({ ok: true, secondsLeft: 0, minutesLeft: 0, exhausted: true });
    }

    const toDeduct = Math.min(seconds, secondsLeft);
    const updated = await prisma.packPurchase.update({
      where: { pin },
      data: { secondsUsed: { increment: toDeduct } },
    });

    const newSecondsLeft = updated.secondsTotal - updated.secondsUsed;

    // Update watch event log
    const eventId = `${videoId}_${pin}`;
    const existing = await prisma.watchEvent.findUnique({ where: { id: eventId } });
    if (existing) {
      await prisma.watchEvent.update({
        where: { id: eventId },
        data: { watchSeconds: { increment: toDeduct } },
      });
    } else {
      await prisma.watchEvent.create({
        data: { id: eventId, videoId, pin, watchSeconds: toDeduct },
      });
    }

    return NextResponse.json({
      ok: true,
      secondsLeft: newSecondsLeft,
      minutesLeft: Math.floor(newSecondsLeft / 60),
      exhausted: newSecondsLeft <= 0,
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
