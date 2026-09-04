import { describe, expect, it } from "vitest";
import { classifyCandidate, isKnownBot } from "../src/core/candidates";

describe("automatic candidate selection", () => {
  it("always accepts direct mentions and replies", () => {
    expect(classifyCandidate("Hallo @PJLauch", "", "PJLauch", false)).toBe("mention");
    expect(classifyCandidate("Gerne", "Replying to PJLauch", "PJLauch", false)).toBe("reply");
  });

  it("only accepts generic greetings during the response window", () => {
    expect(classifyCandidate("Moin zusammen", "", "PJLauch", false)).toBeNull();
    expect(classifyCandidate("Moin zusammen", "", "PJLauch", true)).toBe("greeting");
  });

  it("recognizes common service bots case-insensitively", () => {
    expect(isKnownBot("StreamElements")).toBe(true);
    expect(isKnownBot("real_viewer")).toBe(false);
  });
});
