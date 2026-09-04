import { addressesUser, looksLikeGreeting } from "./greetings";

const KNOWN_BOTS = new Set([
  "fossabot",
  "moobot",
  "nightbot",
  "sery_bot",
  "streamelements",
  "streamlabs",
  "wizebot"
]);

export type CandidateReason = "mention" | "reply" | "greeting";

export function isKnownBot(username: string): boolean {
  return KNOWN_BOTS.has(username.toLocaleLowerCase("en-US"));
}

export function classifyCandidate(
  text: string,
  replyContext: string,
  currentUsername: string | null,
  greetingWindowActive: boolean
): CandidateReason | null {
  if (currentUsername && addressesUser(replyContext, "", currentUsername)) return "reply";
  if (currentUsername && addressesUser(text, "", currentUsername)) return "mention";
  if (greetingWindowActive && looksLikeGreeting(text)) return "greeting";
  return null;
}
