import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Trophy, Star, Target, AlertTriangle, Play, Heart, MessageCircle, ArrowLeft } from "lucide-react";

interface PlayerHighlights {
  player: { id: string; name: string; avatar?: string; rating?: number };
  stats: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    matches: number;
  };
  posts: {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
  }[];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function PlayerHighlightsPage() {
  const router = useRouter();
  const { playerId } = router.query as { playerId: string };
  const [data, setData] = useState<PlayerHighlights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playerId) return;
    fetch(`/api/player/${playerId}/highlights`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [playerId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display font-black text-xl uppercase text-white">Highlights</h1>
            <p className="text-gray-500 text-xs font-display uppercase tracking-widest">Mejores momentos</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          </>
        ) : data ? (
          <>
            {/* Player profile */}
            <div className="flex items-center gap-5">
              {data.player.avatar ? (
                <img
                  src={data.player.avatar}
                  alt={data.player.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#39FF14]/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              <div>
                <h2 className="font-display font-black text-3xl uppercase text-white">
                  {data.player.name}
                </h2>
                {data.player.rating != null && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-bold">
                      {Number(data.player.rating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: "Partidos", value: data.stats.matches, icon: <Trophy size={16} className="text-yellow-400" /> },
                { label: "Goles", value: data.stats.goals, icon: <Target size={16} className="text-[#39FF14]" /> },
                { label: "Asistencias", value: data.stats.assists, icon: <Star size={16} className="text-blue-400" /> },
                { label: "Amarillas", value: data.stats.yellowCards, icon: <AlertTriangle size={16} className="text-yellow-500" /> },
                { label: "Rojas", value: data.stats.redCards, icon: <AlertTriangle size={16} className="text-red-500" /> },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <div className="font-display font-black text-2xl text-white">{s.value}</div>
                  <div className="text-gray-500 text-xs font-display uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Posts grid */}
            {data.posts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <Play size={40} className="mx-auto text-gray-700 mb-3" />
                <p className="font-display font-black uppercase text-gray-600 text-lg">Sin videos aún</p>
                <p className="text-gray-700 text-sm mt-1">Este jugador no ha subido highlights todavía</p>
              </div>
            ) : (
              <>
                <h3 className="font-display font-black uppercase text-white text-lg">
                  Videos ({data.posts.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.posts.map((post) => (
                    <div
                      key={post.id}
                      className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden border border-white/5 group cursor-pointer"
                    >
                      {post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl}
                          alt={post.caption || "Video"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Play size={32} className="text-gray-600" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Play size={20} className="text-white ml-1" />
                        </div>
                      </div>
                      {/* Stats overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex items-center gap-3 text-white text-xs">
                          <span className="flex items-center gap-1">
                            <Heart size={12} className="text-[#39FF14]" /> {post.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={12} /> {post.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
