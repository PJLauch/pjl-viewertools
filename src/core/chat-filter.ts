import type { SessionMessage } from "./chat-history";
import { isKnownBot } from "./candidates";
import { addressesUser } from "./greetings";

export type ChatFilterMode = "text" | "user" | "mentions";

export interface ChatFilterCriteria {
  mode: ChatFilterMode;
  query: string;
  hideKnownBots: boolean;
}

export function filterSessionMessages(
  history: readonly SessionMessage[],
  criteria: ChatFilterCriteria,
  currentUsername: string | null,
  limit = 30
): SessionMessage[] {
  const query = criteria.query.trim().replace(/^@/, "").toLocaleLowerCase("de-DE");
  return history
    .filter((message) => {
      if (criteria.hideKnownBots && isKnownBot(message.username)) return false;
      if (criteria.mode === "mentions") {
        return Boolean(currentUsername && addressesUser(message.text, message.replyContext, currentUsername));
      }
      if (query.length < 2) return false;
      if (criteria.mode === "user") {
        return message.username.toLocaleLowerCase("de-DE").includes(query);
      }
      return message.text.toLocaleLowerCase("de-DE").includes(query);
    })
    .slice(-limit)
    .reverse();
}
