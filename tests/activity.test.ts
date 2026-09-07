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
      message("Old", -300_000)
    ], 60_000);
    expect(activity).toEqual({
      messagesPerMinute: 0.6,
      activeUsers: 2,
      level: "quiet",
      windowMinutes: 5,
      lastMessageAt: 58_000
    });
  });

  it("classifies a fast chat", () => {
    const history = Array.from({ length: 61 }, (_, index) => message(`user${index}`, 59_000));
    expect(calculateChatActivity(history, 60_000)).toMatchObject({
      messagesPerMinute: 61,
      activeUsers: 61,
      level: "rapid",
      windowMinutes: 1
    });
  });

  it("uses a two-minute average for a moderately active chat", () => {
    const history = Array.from({ length: 12 }, (_, index) => message(`user${index % 3}`, 50_000));
    expect(calculateChatActivity(history, 60_000)).toMatchObject({
      messagesPerMinute: 6,
      activeUsers: 3,
      level: "normal",
      windowMinutes: 2
    });
  });

  it("keeps quiet activity visible across five minutes", () => {
    const activity = calculateChatActivity([
      message("Anna", 1_000),
      message("Bob", 181_000)
    ], 240_000);
    expect(activity).toMatchObject({ messagesPerMinute: 0.4, activeUsers: 2, windowMinutes: 5 });
  });
});
