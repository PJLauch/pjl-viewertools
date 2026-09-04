import type { CandidateReason } from "./candidates";

export interface InboxEntry {
  username: string;
  text: string;
  reason: CandidateReason;
  receivedAt: number;
}

export function addInboxEntry(
  entries: readonly InboxEntry[],
  entry: InboxEntry,
  limit = 30
): InboxEntry[] {
  const duplicate = entries.findIndex((item) =>
    item.username.toLocaleLowerCase("en-US") === entry.username.toLocaleLowerCase("en-US")
    && item.text === entry.text
    && item.reason === entry.reason
  );
  const withoutDuplicate = duplicate < 0
    ? entries
    : entries.filter((_, index) => index !== duplicate);
  return [entry, ...withoutDuplicate].slice(0, limit);
}
