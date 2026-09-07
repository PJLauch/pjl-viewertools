import { describe, expect, it } from "vitest";
import { parseChatTimestamp } from "../src/platform/twitch-dom-adapter";

describe("Twitch chat timestamps", () => {
  const localTime = (hours: number, minutes: number) => {
    const value = new Date(2026, 8, 6, hours, minutes, 0, 0);
    return value.getTime();
  };

  it("parses Twitch 12-hour timestamps", () => {
    expect(parseChatTimestamp("03:59 PM", localTime(16, 1))).toBe(localTime(15, 59));
  });

  it("parses Twitch 24-hour timestamps", () => {
    expect(parseChatTimestamp("15:59", localTime(16, 1))).toBe(localTime(15, 59));
  });

  it("treats a future clock time as a message from the previous day", () => {
    expect(parseChatTimestamp("23:59", localTime(0, 1))).toBe(new Date(2026, 8, 5, 23, 59, 0, 0).getTime());
  });

  it("rejects unsupported or invalid timestamps", () => {
    expect(parseChatTimestamp("not a timestamp", localTime(16, 1))).toBeNull();
    expect(parseChatTimestamp("25:99", localTime(16, 1))).toBeNull();
  });
});
