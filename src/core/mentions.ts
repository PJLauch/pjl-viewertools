const TWITCH_USERNAME = /^[a-zA-Z0-9_]{1,25}$/;

export function normalizeUsername(value: string): string | null {
  const username = value.trim().replace(/^@/, "").replace(/[:：]\s*$/, "");
  return TWITCH_USERNAME.test(username) ? username : null;
}

export function buildMentionText(usernames: Iterable<string>): string {
  const seen = new Set<string>();
  const mentions: string[] = [];
  for (const value of usernames) {
    const username = normalizeUsername(value);
    if (!username) continue;
    const key = username.toLocaleLowerCase("en-US");
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push(`@${username}`);
  }
  return mentions.join(" ");
}
