import { describe, expect, it } from "vitest";
import { removeUserNote, sanitizeUserNotes, saveUserNote } from "../src/core/user-notes";

describe("temporary user notes", () => {
  it("saves and replaces a note case-insensitively", () => {
    let notes = saveUserNote([], "@Anna", "mag Cozy Games", 7, 1000);
    notes = saveUserNote(notes, "anna", "streamt selbst", 1, 2000);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ username: "anna", text: "streamt selbst", updatedAt: 2000 });
  });

  it("drops expired and malformed stored notes", () => {
    expect(sanitizeUserNotes([
      { username: "Anna", text: "noch gültig", updatedAt: 2, expiresAt: 200 },
      { username: "Bob", text: "abgelaufen", updatedAt: 1, expiresAt: 99 },
      { username: "", text: "ungültig", updatedAt: 3, expiresAt: 300 }
    ], 100)).toEqual([{ username: "Anna", text: "noch gültig", updatedAt: 2, expiresAt: 200 }]);
  });

  it("removes a note by username", () => {
    const notes = saveUserNote([], "Anna", "test", 7, 1000);
    expect(removeUserNote(notes, "@ANNA")).toEqual([]);
  });
});
