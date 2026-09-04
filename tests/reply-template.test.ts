import { describe, expect, it } from "vitest";
import { formatReplyTemplate } from "../src/core/reply-template";

describe("reply templates", () => {
  it("replaces the mentions placeholder", () => {
    expect(formatReplyTemplate("Hallo {mentions} 👋", ["Anna", "Bob"]))
      .toBe("Hallo @Anna @Bob 👋");
  });

  it("appends mentions when the placeholder is omitted", () => {
    expect(formatReplyTemplate("Moin zusammen", ["Anna"]))
      .toBe("Moin zusammen @Anna");
  });

  it("returns no reply without recipients", () => {
    expect(formatReplyTemplate("Hallo {mentions}", [])).toBe("");
  });
});
