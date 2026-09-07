import type { SessionMessage } from "./chat-history";

export type ActivityLevel = "quiet" | "normal" | "busy" | "rapid";

export interface ChatActivity {
  messagesPerMinute: number;
  activeUsers: number;
  level: ActivityLevel;
  windowMinutes: 1 | 2 | 5;
  lastMessageAt: number | null;
}

export function calculateChatActivity(
  history: readonly SessionMessage[],
  now = Date.now()
): ChatActivity {
  const messagesInLastMinute = history.filter((message) =>
    message.receivedAt > now - 60_000 && message.receivedAt <= now
  ).length;
  const messagesInLastTwoMinutes = history.filter((message) =>
    message.receivedAt > now - 120_000 && message.receivedAt <= now
  ).length;
  const windowMinutes: ChatActivity["windowMinutes"] = messagesInLastMinute > 20
    ? 1
    : messagesInLastTwoMinutes / 2 > 5
      ? 2
      : 5;
  const windowMs = windowMinutes * 60_000;
  const recent = history.filter((message) => message.receivedAt > now - windowMs && message.receivedAt <= now);
  const users = new Set(recent.map((message) => message.username.toLocaleLowerCase("en-US")));
  const rate = Math.round(recent.length / windowMinutes * 10) / 10;
  const level: ActivityLevel = rate <= 5
    ? "quiet"
    : rate <= 20
      ? "normal"
      : rate <= 60
        ? "busy"
        : "rapid";
  const lastMessageAt = history.reduce<number | null>((latest, message) =>
    message.receivedAt <= now && (latest === null || message.receivedAt > latest)
      ? message.receivedAt
      : latest
  , null);
  return { messagesPerMinute: rate, activeUsers: users.size, level, windowMinutes, lastMessageAt };
}
