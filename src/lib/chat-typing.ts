// Process-local "who is typing" registry. Single-instance only — fine for SSE.
// Entries auto-expire after IDLE_MS without a fresh ping.
const IDLE_MS = 4000;

type Entry = { userId: string; userName: string; until: number };
const byRoom = new Map<string, Map<string, Entry>>();

export function setTyping(roomId: string, userId: string, userName: string) {
  let room = byRoom.get(roomId);
  if (!room) {
    room = new Map();
    byRoom.set(roomId, room);
  }
  room.set(userId, { userId, userName, until: Date.now() + IDLE_MS });
}

export function clearTyping(roomId: string, userId: string) {
  byRoom.get(roomId)?.delete(userId);
}

export function listTyping(roomId: string, excludeUserId?: string): { userId: string; userName: string }[] {
  const room = byRoom.get(roomId);
  if (!room) return [];
  const now = Date.now();
  const out: { userId: string; userName: string }[] = [];
  for (const [uid, e] of room) {
    if (e.until < now) {
      room.delete(uid);
      continue;
    }
    if (uid !== excludeUserId) out.push({ userId: e.userId, userName: e.userName });
  }
  return out;
}
