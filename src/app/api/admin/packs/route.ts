import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  return !!token && (await verifyAdminToken(token));
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const packs = await prisma.creditPack.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchases: true } } },
  });
  return NextResponse.json(packs);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, minutes, price, popular, active } = await req.json();
  if (!name || !minutes || !price) {
    return NextResponse.json({ error: "name, minutes, and price are required" }, { status: 400 });
  }
  const pack = await prisma.creditPack.create({
    data: { name, minutes: Number(minutes), price: Number(price), popular: Boolean(popular), active: active !== false },
  });
  return NextResponse.json(pack, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...rest } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const pack = await prisma.creditPack.update({
    where: { id },
    data: {
      ...rest,
      minutes: rest.minutes !== undefined ? Number(rest.minutes) : undefined,
      price: rest.price !== undefined ? Number(rest.price) : undefined,
    },
  });
  return NextResponse.json(pack);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.creditPack.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
