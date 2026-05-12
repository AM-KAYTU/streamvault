import Link from "next/link";
import Image from "next/image";
import { formatDuration } from "@/lib/format";

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration?: number | null;
  category?: string | null;
  views: number;
  featured?: boolean;
}

export default function VideoCard({
  id, title, description, thumbnail,
  duration, category, views, featured,
}: VideoCardProps) {
  return (
    <Link href={`/video/${id}`} className="group block">
      <div className={`card h-full flex flex-col ${featured ? "border-gold/30" : ""}`}>
        <div className="relative aspect-video bg-surface-raised overflow-hidden">
          <Image
            src={thumbnail} alt={title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-14 h-14 bg-gold/90 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
              </svg>
            </div>
          </div>
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-medium">
              {formatDuration(duration)}
            </div>
          )}
          {featured && <div className="absolute top-2 left-2 badge bg-gold text-black">Featured</div>}
        </div>

        <div className="p-4 flex flex-col flex-1">
          {category && (
            <span className="text-xs text-gold font-medium uppercase tracking-wide mb-1">{category}</span>
          )}
          <h3 className="font-semibold text-white group-hover:text-gold transition-colors line-clamp-2 mb-1">
            {title}
          </h3>
          <p className="text-muted text-sm line-clamp-2 flex-1 mb-3">{description}</p>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs text-gold font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Time
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
