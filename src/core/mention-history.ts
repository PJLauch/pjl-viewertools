export type MentionHistoryReason = "mention" | "reply";

export interface MentionHistoryEntry {
  username: string;
  text: string;
  reason: MentionHistoryReason;
  channel: string;
  receivedAt: number;
}

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function sanitizeMentionHistory(
  value: unknown,
  now = Date.now(),
  limit = 100
): MentionHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const oldest = now - RETENTION_MS;
  const entries: MentionHistoryEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<MentionHistoryEntry>;
    const username = cleanUsername(candidate.username);
    const text = typeof candidate.text === "string" ? candidate.text.trim().slice(0, 180) : "";
    const channel = cleanUsername(candidate.channel);
    const receivedAt = typeof candidate.receivedAt === "number" ? candidate.receivedAt : 0;
    if (!username || !text || !channel || !Number.isFinite(receivedAt) || receivedAt < oldest || receivedAt > now) continue;
    if (candidate.reason !== "mention" && candidate.reason !== "reply") continue;
    entries.push({ username, text, channel, reason: candidate.reason, receivedAt });
  }
  return entries.sort((a, b) => b.receivedAt - a.receivedAt).slice(0, limit);
}

export function addMentionHistoryEntry(
  entries: readonly MentionHistoryEntry[],
  entry: MentionHistoryEntry,
  now = Date.now(),
  limit = 100
): MentionHistoryEntry[] {
  const recent = sanitizeMentionHistory(entries, now, limit);
  const duplicate = recent.findIndex((item) =>
    item.username.toLocaleLowerCase("en-US") === entry.username.toLocaleLowerCase("en-US")
    && item.channel.toLocaleLowerCase("en-US") === entry.channel.toLocaleLowerCase("en-US")
    && item.text === entry.text
    && item.reason === entry.reason
  );
  const withoutDuplicate = duplicate < 0 ? recent : recent.filter((_, index) => index !== duplicate);
  return sanitizeMentionHistory([entry, ...withoutDuplicate], now, limit);
}

function cleanUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/^@/, "").trim().slice(0, 40);
  return /^[a-zA-Z0-9_]+$/.test(cleaned) ? cleaned : "";
}
