const GREETING_PATTERN = /(?:^|\s|[!,.?])(?:hallo|hello|hi|hey|heya|moin|servus|welcome|willkommen|wb|guten\s+(?:morgen|abend|tag))(?:\s|[!,.?]|$)/iu;

export function looksLikeGreeting(text: string): boolean {
  return GREETING_PATTERN.test(text);
}

export function addressesUser(text: string, replyContext: string, username: string | null): boolean {
  if (!username) return false;
  const aliases = usernameAliases(username);
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const direct = new RegExp(`(?:^|[^a-zA-Z0-9_])@?${escaped}(?:$|[^a-zA-Z0-9_])`, "iu");
    return direct.test(text) || direct.test(replyContext);
  });
}

export function usernameAliases(username: string): string[] {
  const normalized = username.trim().replace(/^@/, "");
  if (!normalized) return [];
  const acronym = normalized.match(/^[A-Z]{2,}/)?.[0];
  const separated = normalized
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/[_\-\s]+/)
    .filter((part) => part.length >= 3);
  return Array.from(new Set([normalized, ...(acronym && acronym.length >= 3 ? [acronym] : []), ...separated]));
}
