import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VideoDetailClient from "./VideoDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return { title: "Not Found" };
  return {
    title: `${video.title} — StreamVault`,
    description: video.description,
    openGraph: { images: [video.thumbnail] },
  };
}

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  const [video, related] = await Promise.all([
    prisma.video.findUnique({ where: { id: params.id, published: true } }),
    prisma.video.findMany({
      where: { published: true, id: { not: params.id } },
      take: 4,
      orderBy: { views: "desc" },
    }),
  ]);

  if (!video) notFound();

  await prisma.video.update({ where: { id: params.id }, data: { views: { increment: 1 } } });

  return <VideoDetailClient video={video} related={related} />;
}
