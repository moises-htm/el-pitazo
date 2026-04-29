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

const MAX_MESSAGES = 200;

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

function formatAbsoluteTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
  const [showRooms, setShowRooms] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRoomRef = useRef<ChatRoom | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sseErrorCountRef = useRef(0);
  const sseActiveRef = useRef(false);
  const typingPingRef = useRef<number>(0);

  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/auth/login");
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    fetchRooms();
  }, [token]);

  useEffect(() => {
    const scroller = messagesScrollRef.current;
    if (!scroller) return;
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  // Cleanup all real-time connections on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

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

  const fetchMessages = useCallback(
    async (roomId: string, showLoader = true): Promise<ChatMessage[]> => {
      if (showLoader) setLoadingMessages(true);
      try {
        const data = await api<{ messages: ChatMessage[] }>(
          `/api/chat/rooms/${roomId}/messages`
        );
        const msgs = data.messages || [];
        setMessages(msgs);
        return msgs;
      } catch {
        return [];
      } finally {
        if (showLoader) setLoadingMessages(false);
      }
    },
    []
  );

  const startPolling = useCallback(
    (roomId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        if (document.hidden) return;
        const room = selectedRoomRef.current;
        if (room?.id === roomId) fetchMessages(roomId, false);
      }, 3000);
    },
    [fetchMessages]
  );

  const setupSse = useCallback(
    (roomId: string, since?: string) => {
      if (!token || typeof EventSource === "undefined") return false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      sseErrorCountRef.current = 0;
      sseActiveRef.current = true;

      const params = new URLSearchParams({ token });
      if (since) params.set("since", since);

      const es = new EventSource(`/api/chat/rooms/${roomId}/stream?${params}`);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const next = [...prev, msg];
            // Cap in-memory history; older messages remain on the server.
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
          });
        } catch {
          // ignore parse errors
        }
      };

      es.addEventListener("typing", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { users: { userId: string; userName: string }[] };
          setTypingUsers(data.users.filter((u) => u.userId !== user?.id));
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        sseErrorCountRef.current += 1;
        if (sseErrorCountRef.current >= 3) {
          es.close();
          eventSourceRef.current = null;
          sseActiveRef.current = false;
          // Fall back to polling
          const room = selectedRoomRef.current;
          if (room?.id === roomId) startPolling(roomId);
        }
      };

      return true;
    },
    [token, startPolling]
  );

  async function selectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setMessages([]);
    setShowRooms(false);

    // Tear down previous real-time connections
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    sseActiveRef.current = false;

    const msgs = await fetchMessages(room.id);
    const latest = msgs[msgs.length - 1];

    const sseStarted = setupSse(room.id, latest?.createdAt);
    if (!sseStarted) {
      startPolling(room.id);
    }
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
      // Only re-fetch if SSE is not delivering messages
      if (!sseActiveRef.current) {
        await fetchMessages(selectedRoom.id, false);
      }
    } catch {
      setInput(body);
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

  function pingTyping() {
    if (!selectedRoom) return;
    const now = Date.now();
    if (now - typingPingRef.current < 2000) return;
    typingPingRef.current = now;
    api(`/api/chat/rooms/${selectedRoom.id}/typing`, { method: "POST", body: "{}" }).catch(() => {});
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
        } md:flex flex-col w-full md:w-80 shrink-0 backdrop-blur-xl bg-white/5 border-r border-white/5`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 font-display font-black uppercase tracking-wide text-sm">
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
                className={`w-full text-left p-4 flex items-center gap-3 transition-all duration-200 border-b border-white/5 ${
                  selectedRoom?.id === room.id
                    ? "bg-green-500/10 border-l-2 border-l-green-500"
                    : "hover:bg-white/5"
                }`}
              >
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
                  <div className="font-display font-bold uppercase text-sm text-white truncate">
                    {room.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate mt-0.5 font-display uppercase tracking-wide">
                    {room.type === "LIGA" ? "LIGA" : room.type === "TEAM" ? "EQUIPO" : "DM"}
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
            <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
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
                        className={
                          isOwn
                            ? "ml-auto max-w-[75%] bg-gradient-to-br from-green-500/30 to-emerald-600/20 border border-green-500/20 text-white rounded-3xl rounded-br-sm px-4 py-3 mb-1"
                            : "mr-auto max-w-[75%] backdrop-blur-xl bg-white/5 border border-white/10 text-gray-200 rounded-3xl rounded-bl-sm px-4 py-3 mb-1"
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
                          className="text-[10px] text-gray-600 mt-0.5 px-1"
                          title={formatAbsoluteTime(msg.createdAt)}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUsers.length > 0 && (
                <div className="mr-auto px-3 py-2 mt-1 text-xs text-gray-400 italic flex items-center gap-2">
                  <span className="flex gap-1" aria-hidden>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                  </span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].userName} está escribiendo…`
                    : `${typingUsers.length} personas escribiendo…`}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-white/5 backdrop-blur-xl bg-gray-900/90">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => { setInput(e.target.value); pingTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500/50 transition-colors resize-none"
                  style={{ minHeight: "44px", maxHeight: "128px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="btn-neon px-4 py-3 rounded-2xl text-sm active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  aria-label="Enviar"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
