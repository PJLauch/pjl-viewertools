import { describe, expect, it } from "vitest";
import { appendToDraft, canUndoDraft } from "../src/core/composer-draft";

describe("composer draft changes", () => {
  it("keeps the existing draft when appending mentions", () => {
    expect(appendToDraft("Schon getippt", "@Anna @Bob")).toEqual({
      previousText: "Schon getippt",
      insertedText: "Schon getippt @Anna @Bob"
    });
  });

  it("does not create an empty change", () => {
    expect(appendToDraft("Entwurf", "   ")).toBeNull();
  });

  it("only allows undo while the inserted draft is unchanged", () => {
    const change = appendToDraft("Hallo", "@Anna")!;
    expect(canUndoDraft("Hallo @Anna", change)).toBe(true);
    expect(canUndoDraft("Hallo @Anna 👋", change)).toBe(false);
  });
});
