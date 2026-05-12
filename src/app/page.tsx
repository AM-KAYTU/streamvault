import { prisma } from "@/lib/prisma";
import VideoCard from "@/components/VideoCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [videos, counts] = await Promise.all([
    prisma.video.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.video.count({ where: { published: true } }),
  ]);

  const featured = videos.find((v) => v.featured) || videos[0];
  const rest = videos.filter((v) => v.id !== featured?.id);
  const categories = Array.from(new Set(videos.map((v) => v.category).filter(Boolean)));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      {featured && (
        <section className="relative min-h-[65vh] flex items-end pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110"
            style={{ backgroundImage: `url(${featured.thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              {featured.category && (
                <span className="badge bg-gold/10 border border-gold/30 text-gold mb-4 inline-block">{featured.category}</span>
              )}
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">{featured.title}</h1>
              <p className="text-gray-300 text-lg mb-8 line-clamp-3">{featured.description}</p>
              <div className="flex flex-wrap gap-4">
                <Link href={`/video/${featured.id}`} className="btn-gold flex items-center gap-2 text-base px-8 py-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                  </svg>
                  Watch Now
                </Link>
                <Link href="/credits" className="btn-outline flex items-center gap-2 text-base px-8 py-4">
                  Buy Watch Time
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-8 mb-12 text-sm">
          <div><span className="text-gold font-bold text-2xl">{counts}</span><span className="text-muted ml-2">Videos</span></div>
          {categories.length > 0 && <div><span className="text-gold font-bold text-2xl">{categories.length}</span><span className="text-muted ml-2">Categories</span></div>}
          <div><span className="text-gold font-bold text-2xl">HD</span><span className="text-muted ml-2">Quality</span></div>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
            <p className="text-muted">Content is being added. Check back soon.</p>
          </div>
        ) : (
          <>
            {videos.some((v) => v.featured) && (
              <div className="mb-12">
                <h2 className="section-title mb-6 flex items-center gap-3">
                  <span className="w-1 h-6 bg-gold rounded-full inline-block" />Featured
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.filter((v) => v.featured).map((v) => <VideoCard key={v.id} {...v} featured />)}
                </div>
              </div>
            )}
            <div>
              <h2 className="section-title mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-gold rounded-full inline-block" />All Videos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(rest.length > 0 ? rest : videos).map((v) => <VideoCard key={v.id} {...v} />)}
              </div>
            </div>
          </>
        )}

        <section className="mt-20 bg-gradient-to-br from-surface to-surface-high border border-border rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3">Buy Watch Time</h2>
          <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
            Purchase minutes and watch any video until your time runs out. No account, no email — just your PIN.
          </p>
          <Link href="/credits" className="btn-gold text-base px-10 py-4 inline-block">Buy Watch Time</Link>
        </section>
      </div>
    </div>
  );
}
