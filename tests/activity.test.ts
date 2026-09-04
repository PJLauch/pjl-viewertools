import { describe, expect, it } from "vitest";
import { calculateChatActivity } from "../src/core/activity";

describe("chat activity", () => {
  const message = (username: string, receivedAt: number) => ({
    username, text: "test", replyContext: "", receivedAt
  });

  it("counts recent messages and unique users", () => {
    const activity = calculateChatActivity([
      message("Anna", 50_000),
      message("anna", 55_000),
      message("Bob", 58_000),
      message("Old", -1)
    ], 60_000);
    expect(activity).toEqual({ messagesPerMinute: 3, activeUsers: 2, level: "quiet" });
  });

  it("classifies a fast chat", () => {
    const history = Array.from({ length: 61 }, (_, index) => message(`user${index}`, 59_000));
    expect(calculateChatActivity(history, 60_000).level).toBe("rapid");
  });
});
