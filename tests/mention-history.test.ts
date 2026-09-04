import { describe, expect, it } from "vitest";
import { addMentionHistoryEntry, sanitizeMentionHistory } from "../src/core/mention-history";

describe("persistent mention history", () => {
  const now = 40 * 24 * 60 * 60 * 1000;

  it("keeps direct contacts and removes entries older than 30 days", () => {
    const recent = { username: "Anna", text: "@Thomas hi", reason: "mention", channel: "somechannel", receivedAt: now - 1000 };
    const old = { username: "Bob", text: "old", reason: "reply", channel: "somechannel", receivedAt: now - 31 * 24 * 60 * 60 * 1000 };
    expect(sanitizeMentionHistory([old, recent], now)).toEqual([recent]);
  });

  it("rejects greetings and malformed persisted data", () => {
    expect(sanitizeMentionHistory([
      { username: "Anna", text: "hallo", reason: "greeting", channel: "test", receivedAt: now - 1 },
      { username: "bad name", text: "hi", reason: "mention", channel: "test", receivedAt: now - 1 }
    ], now)).toEqual([]);
  });

  it("moves a duplicate to the front and bounds the list", () => {
    const entry = { username: "Anna", text: "ping", reason: "reply" as const, channel: "test", receivedAt: now - 1 };
    const updated = addMentionHistoryEntry([entry], { ...entry, receivedAt: now }, now, 1);
    expect(updated).toEqual([{ ...entry, receivedAt: now }]);
  });
});
