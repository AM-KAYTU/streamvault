import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return !!token && (await verifyAdminToken(token));
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { watchEvents: true } } },
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, description, thumbnail, cfVideoId, category, duration, featured, published } = await req.json();
  if (!title || !cfVideoId || !thumbnail) {
    return NextResponse.json({ error: "title, cfVideoId, and thumbnail are required" }, { status: 400 });
  }
  const video = await prisma.video.create({
    data: {
      title,
      description: description || "",
      thumbnail,
      cfVideoId,
      category: category || null,
      duration: duration ? Number(duration) : null,
      featured: Boolean(featured),
      published: published !== false,
    },
  });
  return NextResponse.json(video, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...rest } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const video = await prisma.video.update({
    where: { id },
    data: {
      ...rest,
      duration: rest.duration !== undefined ? Number(rest.duration) : undefined,
    },
  });
  return NextResponse.json(video);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
