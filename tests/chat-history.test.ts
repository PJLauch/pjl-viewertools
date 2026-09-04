import { describe, expect, it } from "vitest";
import { addChatHistory, conversationMessages, messagesForConversation, messagesForUser, searchChatHistory } from "../src/core/chat-history";

describe("session chat history", () => {
  const message = (username: string, text: string, receivedAt: number) => ({
    username, text, replyContext: "", receivedAt
  });

  it("keeps only the newest bounded messages", () => {
    const history = addChatHistory([message("Anna", "one", 1)], message("Bob", "two", 2), 1);
    expect(history).toEqual([message("Bob", "two", 2)]);
  });

  it("finds a user's recent messages case-insensitively", () => {
    const history = [message("Anna", "one", 1), message("Bob", "two", 2), message("ANNA", "three", 3)];
    expect(messagesForUser(history, "anna").map((item) => item.text)).toEqual(["one", "three"]);
  });

  it("combines the other user's messages with direct replies from the current user", () => {
    const history = [
      message("Anna", "Hallo PJLauch", 1),
      message("PJLauch", "Hallo @Anna", 2),
      message("PJLauch", "Unrelated message", 3),
      message("Bob", "Hallo", 4)
    ];
    expect(messagesForConversation(history, "Anna", "PJLauch").map((item) => item.receivedAt))
      .toEqual([1, 2]);
  });

  it("labels reply and mention relationships in a conversation", () => {
    const history = [
      { ...message("Anna", "Hallo @PJLauch", 1), replyContext: "" },
      { ...message("Anna", "Gerne", 2), replyContext: "Replying to PJLauch" },
      { ...message("PJLauch", "Hi @Anna", 3), replyContext: "" },
      { ...message("PJLauch", "Danke", 4), replyContext: "Replying to Anna" }
    ];
    expect(conversationMessages(history, "Anna", "PJLauch").map((item) => item.relation)).toEqual([
      "mentions-you", "replies-to-you", "your-mention", "your-reply"
    ]);
  });

  it("searches message text and supports username-only queries", () => {
    const history = [
      message("Anna", "Heute spielen wir Minecraft", 1),
      message("Bob", "Hallo Anna", 2)
    ];
    expect(searchChatHistory(history, "minecraft").map((item) => item.username)).toEqual(["Anna"]);
    expect(searchChatHistory(history, "@ann").map((item) => item.username)).toEqual(["Anna"]);
    expect(searchChatHistory(history, "@bob").map((item) => item.username)).toEqual(["Bob"]);
  });
});
