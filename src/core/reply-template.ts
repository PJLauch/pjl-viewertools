import { buildMentionText } from "./mentions";

export const DEFAULT_REPLY_TEMPLATE = "Hallo {mentions} 👋";

export function formatReplyTemplate(template: string, usernames: Iterable<string>): string {
  const mentions = buildMentionText(usernames);
  if (!mentions) return "";
  const cleanTemplate = template.trim() || "{mentions}";
  const result = cleanTemplate.includes("{mentions}")
    ? cleanTemplate.replaceAll("{mentions}", mentions)
    : `${cleanTemplate} ${mentions}`;
  return result.replace(/\s+/gu, " ").trim();
}
