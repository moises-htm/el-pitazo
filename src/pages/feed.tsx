import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Heart, MessageCircle, Play, Upload, Trophy, X } from "lucide-react";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { toast } from "sonner";
import Link from "next/link";

interface Post {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isFeatured: boolean;
  createdAt: string;
  uploader: { id: string; name: string; avatar?: string };
}

interface Comment {
  id: string;
  userName: string;
  body: string;
  createdAt: string;
}

export default function FeedPage() {
  const { user, token } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => { fetchPosts(1); }, []);

  async function fetchPosts(p: number) {
    setLoading(true);
    try {
      const data = await api<{ posts: Post[] }>(`/api/feed?page=${p}`, token ? { auth: true } : {});
      if (p === 1) setPosts(data.posts);
      else setPosts(prev => [...prev, ...data.posts]);
      setHasMore(data.posts.length === 10);
      setPage(p);
    } catch {
      toast.error("Error cargando el feed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(post: Post) {
    if (!token) { toast.error("Inicia sesión para dar like"); return; }
    const method = post.likedByMe ? "DELETE" : "POST";
    await api(`/api/feed/${post.id}/like`, { method, auth: true });
    setPosts(prev => prev.map(p => p.id === post.id ? {
      ...p,
      likedByMe: !p.likedByMe,
      likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
    } : p));
  }

  async function openComments(post: Post) {
    setActivePost(post);
    setShowComments(true);
    const data = await api<{ comments: Comment[] }>(`/api/feed/${post.id}/comments`);
    setComments(data.comments);
  }

  async function postComment() {
    if (!token) { toast.error("Inicia sesión para comentar"); return; }
    if (!commentInput.trim() || !activePost) return;
    await api(`/api/feed/${activePost.id}/comments`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ body: commentInput }),
      headers: { "Content-Type": "application/json" },
    });
    setCommentInput("");
    const data = await api<{ comments: Comment[] }>(`/api/feed/${activePost.id}/comments`);
    setComments(data.comments);
  }

  async function uploadVideo() {
    if (!uploadFile) { toast.error("Selecciona un video"); return; }
    if (!token) { toast.error("Inicia sesión para subir videos"); return; }
    setUploading(true);
    try {
      // Upload to Vercel Blob
      const uploadRes = await fetch(`/api/feed/upload?filename=${encodeURIComponent(uploadFile.name)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFile,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Error al subir");
      }
      const { url: videoUrl } = await uploadRes.json();

      // Create post
      await api("/api/feed", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ videoUrl, caption: uploadCaption }),
        headers: { "Content-Type": "application/json" },
      });

      toast.success("¡Video publicado!");
      setShowUploadModal(false);
      setUploadCaption("");
      setUploadFile(null);
      fetchPosts(1);
    } catch (e: any) {
      toast.error(e.message || "Error al publicar");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-pitch-grid animate-fade-in-up text-white overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, #0a0a0a, transparent)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <h1 className="font-display font-black text-xl uppercase tracking-widest">EL PITAZO</h1>
          <span className="text-gray-600 text-xs font-display uppercase tracking-widest">FEED</span>
        </div>
        <div className="flex items-center gap-2">
          {!token && (
            <Link href="/auth/login" className="text-gray-400 hover:text-[#39FF14] text-sm font-display uppercase tracking-wide transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Feed: vertical scroll */}
      <div className="pb-20">
        {loading && posts.length === 0 ? (
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 w-full" style={{ height: "70vh" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Play size={48} className="text-gray-600 mb-4" />
            <h3 className="font-display font-black text-2xl uppercase">Sin videos aún</h3>
            <p className="text-gray-400 text-sm mt-1">¡Sé el primero en compartir un gol!</p>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4 hover:border-white/15 transition-all duration-300 mx-4">
                {/* Featured badge */}
                {post.isFeatured && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#39FF14] text-black text-xs font-display font-black uppercase px-3 py-1 rounded-full tracking-wide shadow-neon-sm">
                    <Trophy size={10} /> GOL DE LA JORNADA
                  </div>
                )}

                {/* Video — full width, 9:16 on mobile, constrained on desktop */}
                <div className="rounded-t-3xl overflow-hidden relative w-full mx-auto" style={{ maxWidth: '480px' }}>
                  <div style={{ aspectRatio: '9/16', position: 'relative', background: '#111' }}>
                    <video
                      src={post.videoUrl}
                      poster={post.thumbnailUrl}
                      className="w-full aspect-video object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    />

                    {/* RIGHT SIDE — floating action buttons (TikTok style) */}
                    <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
                      {/* Like */}
                      <button onClick={() => toggleLike(post)}
                        className="flex flex-col items-center gap-1">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${post.likedByMe ? 'bg-[#39FF14]' : 'bg-black/50 backdrop-blur-sm border border-white/20'} transition-all`}
                          style={post.likedByMe ? { boxShadow: '0 0 12px #39FF14' } : {}}>
                          <Heart size={22} fill={post.likedByMe ? "#000" : "none"} className={post.likedByMe ? "text-black" : "text-white"} />
                        </div>
                        <span className="text-white text-xs font-bold drop-shadow">{post.likesCount}</span>
                      </button>

                      {/* Comment */}
                      <button onClick={() => openComments(post)}
                        className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <MessageCircle size={22} className="text-white" />
                        </div>
                        <span className="text-white text-xs font-bold drop-shadow">{post.commentsCount}</span>
                      </button>

                      {/* Share */}
                      <div className="flex flex-col items-center gap-1">
                        <WhatsAppShareButton
                          text={`Mira este golazo en El Pitazo ⚽🔥\n${typeof window !== "undefined" ? window.location.origin : ""}/feed?post=${post.id}`}
                          compact={true}
                          className="!w-11 !h-11 !rounded-full !bg-black/50 backdrop-blur-sm !border !border-white/20 hover:!bg-[#39FF14]/20 !p-0 !flex !items-center !justify-center"
                        />
                        <span className="text-white text-xs font-bold drop-shadow">Share</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM INFO — overlaid on video bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 overflow-hidden flex items-center justify-center text-green-400 font-bold text-sm">
                        {post.uploader.avatar ? (
                          <img src={post.uploader.avatar} alt="" className="w-full h-full object-cover" />
                        ) : post.uploader.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-white text-sm">{post.uploader.name}</span>
                    </div>
                    {post.caption && (
                      <p className="text-gray-400 text-sm mt-1 leading-snug">{post.caption}</p>
                    )}
                  </div>
                </div>

                {/* Below-video action row */}
                <div className="p-4 flex items-center gap-4 border-t border-white/5">
                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors duration-200 text-sm"
                  >
                    <Heart size={16} fill={post.likedByMe ? "currentColor" : "none"} className={post.likedByMe ? "text-red-400" : ""} />
                    {post.likesCount}
                  </button>
                  <button
                    onClick={() => openComments(post)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                  >
                    <MessageCircle size={16} />
                    {post.commentsCount}
                  </button>
                  <div className="ml-auto">
                    <WhatsAppShareButton
                      text={`Mira este golazo en El Pitazo ⚽🔥\n${typeof window !== "undefined" ? window.location.origin : ""}/feed?post=${post.id}`}
                      compact={true}
                      className="!text-gray-400 hover:!text-green-400 !bg-transparent !border-0 !p-0"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => fetchPosts(page + 1)}
                  disabled={loading}
                  className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg text-sm transition-all">
                  {loading ? "Cargando..." : "Ver más"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Panel — bottom sheet */}
      {showComments && activePost && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowComments(false)} />
          <div className="relative bg-[#111] border-t border-white/10 rounded-t-2xl w-full max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-semibold">Comentarios</span>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Sin comentarios aún</p>
              )}
              {comments.map(c => (
                <div key={c.id}>
                  <span className="text-white font-medium text-sm">{c.userName} </span>
                  <span className="text-gray-300 text-sm">{c.body}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && postComment()}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
              <button
                onClick={postComment}
                className="btn-neon p-2 rounded-lg transition-all">
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB — floating upload button */}
      {token && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full btn-neon flex items-center justify-center shadow-2xl shadow-green-500/20 animate-pulse-glow active:scale-95 transition-transform"
          aria-label="Subir video"
        >
          <Upload size={22} />
        </button>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUploadModal(false)} />
          <div className="relative glass rounded-3xl p-6 max-w-sm mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Subir video</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
            />

            {uploadFile ? (
              <div className="bg-white/5 rounded-xl p-3 mb-3 flex items-center gap-2">
                <Play size={16} className="text-[#39FF14]" />
                <span className="text-white text-sm truncate">{uploadFile.name}</span>
                <button onClick={() => setUploadFile(null)} className="ml-auto text-gray-400 hover:text-white"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#39FF14]/20 hover:border-[#39FF14]/60 rounded-xl p-8 text-center mb-3 transition-all">
                <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">Toca para seleccionar un video</p>
                <p className="text-gray-500 text-xs mt-1">MP4, MOV — máx 30 segundos</p>
              </button>
            )}

            <textarea
              value={uploadCaption}
              onChange={e => setUploadCaption(e.target.value)}
              placeholder="Descripción (opcional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39FF14] resize-none mb-3"
            />

            <button
              onClick={uploadVideo}
              disabled={!uploadFile || uploading}
              className="btn-neon w-full disabled:opacity-50 py-3 rounded-xl font-semibold transition-all">
              {uploading ? "Subiendo..." : "Publicar video"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
