import { describe, expect, it } from "vitest";
import { isShortcutCommand, isShortcutControlMessage, isShortcutMessage } from "../src/core/shortcut-command";

describe("shortcut commands", () => {
  it("accepts the three safe UI commands", () => {
    expect(isShortcutCommand("toggle-panel")).toBe(true);
    expect(isShortcutCommand("toggle-user-selection")).toBe(true);
    expect(isShortcutCommand("choose-note-user")).toBe(true);
  });

  it("rejects sending and unknown commands", () => {
    expect(isShortcutCommand("send-message")).toBe(false);
    expect(isShortcutCommand(123)).toBe(false);
  });

  it("validates messages received by the content script", () => {
    expect(isShortcutMessage({ type: "pjl-shortcut", command: "toggle-panel" })).toBe(true);
    expect(isShortcutMessage({ type: "other", command: "toggle-panel" })).toBe(false);
  });

  it("only accepts known shortcut control requests", () => {
    expect(isShortcutControlMessage({ type: "pjl-get-shortcuts" })).toBe(true);
    expect(isShortcutControlMessage({ type: "pjl-open-shortcut-settings" })).toBe(true);
    expect(isShortcutControlMessage({ type: "pjl-delete-data" })).toBe(false);
  });
});
