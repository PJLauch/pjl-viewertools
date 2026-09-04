import { describe, expect, it } from "vitest";
import { addInboxEntry } from "../src/core/inbox";

describe("session inbox", () => {
  it("puts newest messages first and respects the limit", () => {
    const one = { username: "anna", text: "Hi", reason: "greeting" as const, receivedAt: 1 };
    const two = { username: "bob", text: "@PJLauch", reason: "mention" as const, receivedAt: 2 };
    expect(addInboxEntry([one], two, 1)).toEqual([two]);
  });

  it("moves an identical repeated event to the front instead of duplicating it", () => {
    const old = { username: "anna", text: "Hallo", reason: "greeting" as const, receivedAt: 1 };
    const fresh = { ...old, receivedAt: 2 };
    expect(addInboxEntry([old], fresh)).toEqual([fresh]);
  });
});
