import type { ChatMessage } from "../platform/chat-adapter";
import { addressesUser } from "./greetings";

export interface SessionMessage extends ChatMessage {
  receivedAt: number;
}

export type ConversationRelation = "message" | "mentions-you" | "replies-to-you" | "your-mention" | "your-reply";

export interface ConversationMessage extends SessionMessage {
  relation: ConversationRelation;
  own: boolean;
}

export function addChatHistory(
  history: readonly SessionMessage[],
  message: SessionMessage,
  limit = 1_000
): SessionMessage[] {
  return [...history, message].slice(-limit);
}

export function messagesForUser(
  history: readonly SessionMessage[],
  username: string,
  limit = 10
): SessionMessage[] {
  const key = username.toLocaleLowerCase("en-US");
  return history
    .filter((message) => message.username.toLocaleLowerCase("en-US") === key)
    .slice(-limit);
}

export function messagesForConversation(
  history: readonly SessionMessage[],
  otherUsername: string,
  currentUsername: string | null,
  limit = 12
): SessionMessage[] {
  return conversationMessages(history, otherUsername, currentUsername, limit);
}

export function conversationMessages(
  history: readonly SessionMessage[],
  otherUsername: string,
  currentUsername: string | null,
  limit = 12
): ConversationMessage[] {
  const otherKey = otherUsername.toLocaleLowerCase("en-US");
  const currentKey = currentUsername?.toLocaleLowerCase("en-US") ?? null;
  return history
    .flatMap((message): ConversationMessage[] => {
      const authorKey = message.username.toLocaleLowerCase("en-US");
      if (authorKey === otherKey) {
        const relation: ConversationRelation = currentUsername && addressesUser(message.replyContext, "", currentUsername)
          ? "replies-to-you"
          : currentUsername && addressesUser(message.text, "", currentUsername)
            ? "mentions-you"
            : "message";
        return [{ ...message, own: false, relation }];
      }
      if (!currentKey || authorKey !== currentKey || !addressesUser(message.text, message.replyContext, otherUsername)) return [];
      const relation: ConversationRelation = addressesUser(message.replyContext, "", otherUsername)
        ? "your-reply"
        : "your-mention";
      return [{ ...message, own: true, relation }];
    })
    .slice(-limit);
}

export function searchChatHistory(
  history: readonly SessionMessage[],
  rawQuery: string,
  limit = 20
): SessionMessage[] {
  const query = rawQuery.trim().toLocaleLowerCase("de-DE");
  if (query.length < 2) return [];
  const usernameOnly = query.startsWith("@");
  const needle = usernameOnly ? query.slice(1) : query;
  if (!needle) return [];
  return history
    .filter((message) => {
      const username = message.username.toLocaleLowerCase("de-DE");
      if (username.includes(needle)) return true;
      return !usernameOnly && message.text.toLocaleLowerCase("de-DE").includes(needle);
    })
    .slice(-limit)
    .reverse();
}
