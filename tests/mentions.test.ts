import { describe, expect, it } from "vitest";
import { buildMentionText, normalizeUsername } from "../src/core/mentions";

describe("mention composition", () => {
  it("deduplicates case-insensitively", () => {
    expect(buildMentionText(["Thomas", "@anna", "thomas"])).toBe("@Thomas @anna");
  });
  it("drops invalid values", () => {
    expect(buildMentionText(["valid_name", "has space", "@"])).toBe("@valid_name");
  });
  it("enforces Twitch-style usernames", () => {
    expect(normalizeUsername("User_123")).toBe("User_123");
    expect(normalizeUsername("@User_123:")).toBe("User_123");
    expect(normalizeUsername("x".repeat(26))).toBeNull();
  });
});
