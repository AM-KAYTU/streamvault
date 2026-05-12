import { prisma } from "@/lib/prisma";
import CreditsClient from "./CreditsClient";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const packs = await prisma.creditPack.findMany({
    where: { active: true },
    orderBy: { minutes: "asc" },
  });

  return <CreditsClient packs={packs} />;
}
