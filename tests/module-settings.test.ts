import { describe, expect, it } from "vitest";
import { DEFAULT_MODULE_SETTINGS, sanitizeModuleSettings } from "../src/core/module-settings";

describe("module settings", () => {
  it("enables every module by default", () => {
    expect(sanitizeModuleSettings(undefined)).toEqual(DEFAULT_MODULE_SETTINGS);
  });

  it("keeps explicit boolean choices and repairs missing values", () => {
    expect(sanitizeModuleSettings({ activity: false, notes: true, search: false })).toEqual({
      activity: false,
      notes: true,
      mentionHistory: true,
      search: false,
      filters: true
    });
  });

  it("ignores invalid stored values", () => {
    expect(sanitizeModuleSettings({ activity: "no", notes: 0 })).toEqual(DEFAULT_MODULE_SETTINGS);
  });
});
