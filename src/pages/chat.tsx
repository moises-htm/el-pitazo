import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { MessageCircle, Send, ChevronLeft, Users, Trophy, User2 } from "lucide-react";
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

function RoomTypeBadge({ type }: { type: ChatRoom["type"] }) {
  if (type === "LIGA") {
    return (
      <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
        <Trophy size={10} /> Liga
      </span>
    );
  }
  if (type === "CAPTAIN_DM") {
    return (
      <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
        <User2 size={10} /> Capitán
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
      <Users size={10} /> Equipo
    </span>
  );
}

function RoomIcon({ type }: { type: ChatRoom["type"] }) {
  if (type === "LIGA") return <Trophy size={18} className="text-yellow-400" />;
  if (type === "CAPTAIN_DM") return <User2 size={18} className="text-blue-400" />;
  return <Users size={18} className="text-green-400" />;
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

  // Polling
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft size={22} />
        </button>
        <MessageCircle size={20} className="text-green-400" />
        <h1 className="text-white font-bold text-lg">Chat</h1>
        {selectedRoom && !showRooms && (
          <span className="text-gray-400 text-sm ml-1 truncate">{selectedRoom.name}</span>
        )}
        <div className="flex-1" />
        {/* Mobile: back to room list */}
        {!showRooms && (
          <button
            onClick={() => setShowRooms(true)}
            className="md:hidden text-gray-400 hover:text-white transition-colors text-sm"
          >
            Salas
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Room List */}
        <aside
          className={`
            w-full md:w-80 md:min-w-[280px] border-r border-white/10 bg-black/20 flex flex-col
            ${showRooms ? "flex" : "hidden md:flex"}
          `}
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">Mis salas</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                No tienes salas de chat aún.
                <br />
                Únete a un equipo para chatear.
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5 ${
                    selectedRoom?.id === room.id ? "bg-white/10 border-l-2 border-l-green-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <RoomIcon type={room.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-white text-sm font-medium truncate">{room.name}</span>
                        <RoomTypeBadge type={room.type} />
                      </div>
                      {room.lastMessage && (
                        <p className="text-gray-500 text-xs truncate mt-0.5">{room.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main
          className={`
            flex-1 flex flex-col min-w-0
            ${!showRooms ? "flex" : "hidden md:flex"}
          `}
        >
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageCircle size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Selecciona una sala para chatear</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className={`h-12 ${i % 2 === 0 ? "w-3/4" : "w-1/2 ml-auto"}`} />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                    <MessageCircle size={32} className="mb-2 opacity-30" />
                    No hay mensajes aún. ¡Sé el primero!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.userId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                      >
                        {!isOwn && (
                          <span className="text-xs text-gray-500 mb-1 px-1">{msg.userName}</span>
                        )}
                        <div
                          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl text-sm break-words ${
                            isOwn
                              ? "bg-green-600 text-white rounded-br-sm"
                              : "bg-white/10 text-gray-100 rounded-bl-sm"
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-xs text-gray-600 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-3 bg-black/20">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje... (Enter para enviar)"
                    rows={1}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none resize-none max-h-32"
                    style={{ minHeight: "42px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="shrink-0 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all"
                    aria-label="Enviar"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
