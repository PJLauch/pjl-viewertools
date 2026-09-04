export interface UserNote {
  username: string;
  text: string;
  updatedAt: number;
  expiresAt: number;
}

export function sanitizeUserNotes(value: unknown, now = Date.now()): UserNote[] {
  if (!Array.isArray(value)) return [];
  const notes = new Map<string, UserNote>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<UserNote>;
    const username = typeof candidate.username === "string"
      ? candidate.username.replace(/^@/, "").trim().slice(0, 40)
      : "";
    const text = typeof candidate.text === "string" ? candidate.text.trim().slice(0, 300) : "";
    const updatedAt = typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0;
    const expiresAt = typeof candidate.expiresAt === "number" ? candidate.expiresAt : 0;
    if (!username || !text || !Number.isFinite(expiresAt) || expiresAt <= now) continue;
    const key = username.toLocaleLowerCase("en-US");
    const previous = notes.get(key);
    if (!previous || updatedAt >= previous.updatedAt) notes.set(key, { username, text, updatedAt, expiresAt });
  }
  return Array.from(notes.values()).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100);
}

export function saveUserNote(
  notes: readonly UserNote[],
  username: string,
  text: string,
  durationDays: number,
  now = Date.now()
): UserNote[] {
  const cleanUsername = username.replace(/^@/, "").trim().slice(0, 40);
  const cleanText = text.trim().slice(0, 300);
  if (!cleanUsername || !cleanText || !Number.isFinite(durationDays) || durationDays <= 0) return [...notes];
  const key = cleanUsername.toLocaleLowerCase("en-US");
  const next = notes.filter((item) => item.username.toLocaleLowerCase("en-US") !== key);
  next.unshift({
    username: cleanUsername,
    text: cleanText,
    updatedAt: now,
    expiresAt: now + durationDays * 24 * 60 * 60 * 1000
  });
  return next.slice(0, 100);
}

export function removeUserNote(notes: readonly UserNote[], username: string): UserNote[] {
  const key = username.replace(/^@/, "").trim().toLocaleLowerCase("en-US");
  return notes.filter((item) => item.username.toLocaleLowerCase("en-US") !== key);
}
