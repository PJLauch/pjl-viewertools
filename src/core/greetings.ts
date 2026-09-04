const GREETING_PATTERN = /(?:^|\s|[!,.?])(?:hallo|hello|hi|hey|heya|moin|servus|welcome|willkommen|wb|guten\s+(?:morgen|abend|tag))(?:\s|[!,.?]|$)/iu;

export function looksLikeGreeting(text: string): boolean {
  return GREETING_PATTERN.test(text);
}

export function addressesUser(text: string, replyContext: string, username: string | null): boolean {
  if (!username) return false;
  const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const direct = new RegExp(`(?:^|[^a-zA-Z0-9_])@?${escaped}(?:$|[^a-zA-Z0-9_])`, "iu");
  return direct.test(text) || direct.test(replyContext);
}
