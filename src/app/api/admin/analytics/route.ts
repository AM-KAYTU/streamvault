import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalVideos,
    totalPurchases,
    topVideos,
    recentPurchases,
    watchStats,
  ] = await Promise.all([
    prisma.video.count({ where: { published: true } }),
    prisma.packPurchase.count(),
    prisma.video.findMany({
      take: 5,
      orderBy: { views: "desc" },
      select: {
        id: true, title: true, views: true,
        _count: { select: { watchEvents: true } },
      },
    }),
    prisma.packPurchase.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { pack: { select: { name: true, price: true } } },
    }),
    prisma.watchEvent.aggregate({ _sum: { watchSeconds: true } }),
  ]);

  // Active = still has seconds left
  const allPurchases = await prisma.packPurchase.findMany({
    include: { pack: { select: { price: true } } },
  });
  const totalRevenue = allPurchases.reduce((sum, p) => sum + p.pack.price, 0);
  const activePurchases = allPurchases.filter((p) => p.secondsTotal - p.secondsUsed > 0).length;
  const exhaustedPurchases = allPurchases.length - activePurchases;

  return NextResponse.json({
    totals: {
      videos: totalVideos,
      totalPurchases,
      activePurchases,
      exhaustedPurchases,
      totalRevenue,
      totalWatchMinutes: Math.floor((watchStats._sum.watchSeconds || 0) / 60),
    },
    topVideos,
    recentPurchases,
  });
}
