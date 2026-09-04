import { describe, expect, it } from "vitest";
import { filterSessionMessages } from "../src/core/chat-filter";
import type { SessionMessage } from "../src/core/chat-history";

const history: SessionMessage[] = [
  { username: "Anna", text: "Heute Minecraft?", replyContext: "", receivedAt: 1 },
  { username: "StreamElements", text: "Werbung", replyContext: "", receivedAt: 2 },
  { username: "Bob", text: "Hallo @Thomas", replyContext: "", receivedAt: 3 },
  { username: "Clara", text: "ja", replyContext: "Replying to Thomas", receivedAt: 4 }
];

describe("session chat filters", () => {
  it("filters by message text or partial username", () => {
    expect(filterSessionMessages(history, { mode: "text", query: "mine", hideKnownBots: false }, "Thomas")[0]?.username).toBe("Anna");
    expect(filterSessionMessages(history, { mode: "user", query: "@ann", hideKnownBots: false }, null)[0]?.username).toBe("Anna");
  });

  it("finds direct mentions and replies to the current user", () => {
    expect(filterSessionMessages(history, { mode: "mentions", query: "", hideKnownBots: false }, "Thomas")
      .map((item) => item.username)).toEqual(["Clara", "Bob"]);
  });

  it("can exclude known service bots", () => {
    expect(filterSessionMessages(history, { mode: "text", query: "werbung", hideKnownBots: true }, "Thomas")).toEqual([]);
  });
});
