import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { MessageCircle, Send, Users, Trophy, User2, ArrowLeft, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChatRoom {
  id: string;
  type: "LIGA" | "CAPTAIN_DM" | "TEAM";
  tournamentId?: string;
  teamId?: string;
  name: string;
  createdAt: string;
  unread: number;
  lastMessage?: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function formatTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
  } catch {
    return "";
  }
}

export default function ChatPage() {
  const router = useRouter();
  const { user, token, hydrated, hydrate } = useAuthStore();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showRooms, setShowRooms] = useState(true); // mobile: show room list vs chat

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRoomRef = useRef<ChatRoom | null>(null);

  // Keep ref in sync for polling closure
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Hydrate auth on mount
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Auth guard
  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/auth/login");
    }
  }, [hydrated, token, router]);

  // Load rooms
  useEffect(() => {
    if (!token) return;
    fetchRooms();
  }, [token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling — 3s, skips when tab hidden
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedRoom) return;

    pollingRef.current = setInterval(() => {
      if (document.hidden) return;
      const room = selectedRoomRef.current;
      if (room) fetchMessages(room.id, false);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedRoom]);

  async function fetchRooms() {
    setLoadingRooms(true);
    try {
      const data = await api<{ rooms: ChatRoom[] }>("/api/chat/rooms");
      setRooms(data.rooms || []);
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  }

  const fetchMessages = useCallback(async (roomId: string, showLoader = true) => {
    if (showLoader) setLoadingMessages(true);
    try {
      const data = await api<{ messages: ChatMessage[] }>(`/api/chat/rooms/${roomId}/messages`);
      setMessages(data.messages || []);
    } catch {
      // ignore
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  }, []);

  function selectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setMessages([]);
    fetchMessages(room.id);
    setShowRooms(false); // mobile: switch to chat view
  }

  async function sendMessage() {
    if (!input.trim() || !selectedRoom || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    try {
      await api(`/api/chat/rooms/${selectedRoom.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      await fetchMessages(selectedRoom.id, false);
    } catch {
      setInput(body); // restore on error
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!hydrated || !token) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-display uppercase tracking-widest text-sm">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* ── Left panel — room list ── */}
      <div
        className={`${
          showRooms ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-80 border-r border-white/5 bg-[#111] shrink-0`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-xl uppercase text-white">CHAT</h1>
              <p className="text-gray-500 text-xs font-display uppercase tracking-widest">
                El Pitazo
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
              aria-label="Volver"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageCircle size={40} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm font-display uppercase">Sin salas aún</p>
              <p className="text-gray-700 text-xs mt-1">Únete a un equipo para chatear</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room)}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all border-b border-white/[0.04] ${
                  selectedRoom?.id === room.id
                    ? "bg-[#39FF14]/10 border-l-2 border-l-[#39FF14]"
                    : "hover:bg-white/5"
                }`}
              >
                {/* Room type icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    room.type === "LIGA"
                      ? "bg-yellow-500/20"
                      : room.type === "TEAM"
                      ? "bg-[#39FF14]/20"
                      : "bg-blue-500/20"
                  }`}
                >
                  {room.type === "LIGA" ? (
                    <Trophy size={18} className="text-yellow-400" />
                  ) : room.type === "TEAM" ? (
                    <Users size={18} className="text-[#39FF14]" />
                  ) : (
                    <User2 size={18} className="text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm uppercase text-white truncate">
                    {room.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate mt-0.5 font-display uppercase tracking-wide">
                    {room.type === "LIGA"
                      ? "LIGA"
                      : room.type === "TEAM"
                      ? "EQUIPO"
                      : "DM"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right panel — messages ── */}
      <div
        className={`${
          showRooms ? "hidden" : "flex"
        } md:flex flex-col flex-1 bg-[#0a0a0a]`}
      >
        {/* Messages header */}
        {selectedRoom ? (
          <div className="px-5 py-3.5 border-b border-white/5 bg-[#111] flex items-center gap-3">
            <button
              onClick={() => setShowRooms(true)}
              className="md:hidden text-gray-400 hover:text-white mr-1"
              aria-label="Ver salas"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                selectedRoom.type === "LIGA"
                  ? "bg-yellow-500/20"
                  : selectedRoom.type === "TEAM"
                  ? "bg-[#39FF14]/20"
                  : "bg-blue-500/20"
              }`}
            >
              {selectedRoom.type === "LIGA" ? (
                <Trophy size={16} className="text-yellow-400" />
              ) : selectedRoom.type === "TEAM" ? (
                <Users size={16} className="text-[#39FF14]" />
              ) : (
                <User2 size={16} className="text-blue-400" />
              )}
            </div>
            <div>
              <div className="font-display font-black text-base uppercase text-white">
                {selectedRoom.name}
              </div>
              <div className="text-xs text-gray-500 font-display uppercase tracking-wide">
                {selectedRoom.type === "LIGA"
                  ? "CHAT DE LIGA"
                  : selectedRoom.type === "TEAM"
                  ? "CHAT DE EQUIPO"
                  : "MENSAJE DIRECTO"}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3.5 border-b border-white/5 bg-[#111]">
            <div className="font-display font-black text-lg uppercase text-white">MENSAJES</div>
          </div>
        )}

        {/* Messages area or empty state */}
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <MessageCircle size={48} className="text-gray-800 mb-4" />
            <p className="font-display font-black text-xl uppercase text-gray-700">
              Selecciona una sala
            </p>
            <p className="text-gray-700 text-sm mt-1">
              Elige una conversación para empezar
            </p>
          </div>
        ) : (
          <>
            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={`h-12 ${i % 2 === 0 ? "w-3/4" : "w-1/2 ml-auto"}`}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm">
                  <MessageCircle size={32} className="mb-2 opacity-30" />
                  <p className="font-display uppercase">No hay mensajes aún. ¡Sé el primero!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.userId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? "bg-[#39FF14] text-black rounded-br-sm"
                            : "bg-white/[0.08] text-white rounded-bl-sm border border-white/5"
                        }`}
                        style={
                          isOwn
                            ? { boxShadow: "0 0 12px rgba(57,255,20,0.25)" }
                            : {}
                        }
                      >
                        {!isOwn && (
                          <div
                            className="text-[10px] font-display font-bold uppercase tracking-widest mb-0.5"
                            style={{ color: "#39FF14" }}
                          >
                            {msg.userName}
                          </div>
                        )}
                        <p className="text-sm leading-snug">{msg.body}</p>
                        <div
                          className={`text-[10px] mt-1 ${
                            isOwn ? "text-black/50" : "text-gray-600"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-white/5 bg-[#111]">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#39FF14]/40 focus:outline-none resize-none"
                  style={{ minHeight: "44px", maxHeight: "128px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 rounded-xl bg-[#39FF14] hover:bg-[#4fff2a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                  style={{
                    boxShadow: input.trim()
                      ? "0 0 12px rgba(57,255,20,0.4)"
                      : "none",
                  }}
                  aria-label="Enviar"
                >
                  <Send size={18} className="text-black" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
