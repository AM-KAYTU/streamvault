import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({
    where: { id: params.id, published: true },
    select: {
      id: true, title: true, description: true, thumbnail: true,
      category: true, duration: true, views: true,
      featured: true, createdAt: true,
    },
  });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(video);
}
