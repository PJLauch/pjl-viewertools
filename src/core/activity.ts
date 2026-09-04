import type { SessionMessage } from "./chat-history";

export type ActivityLevel = "quiet" | "normal" | "busy" | "rapid";

export interface ChatActivity {
  messagesPerMinute: number;
  activeUsers: number;
  level: ActivityLevel;
}

export function calculateChatActivity(
  history: readonly SessionMessage[],
  now = Date.now(),
  windowMs = 60_000
): ChatActivity {
  const recent = history.filter((message) => message.receivedAt > now - windowMs && message.receivedAt <= now);
  const users = new Set(recent.map((message) => message.username.toLocaleLowerCase("en-US")));
  const rate = Math.round(recent.length * 60_000 / windowMs);
  const level: ActivityLevel = rate <= 5
    ? "quiet"
    : rate <= 20
      ? "normal"
      : rate <= 60
        ? "busy"
        : "rapid";
  return { messagesPerMinute: rate, activeUsers: users.size, level };
}
