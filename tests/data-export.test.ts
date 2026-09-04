import { describe, expect, it } from "vitest";
import { createDataExport, parseDataImport } from "../src/core/data-export";
import { DEFAULT_MODULE_SETTINGS } from "../src/core/module-settings";

describe("local data export", () => {
  it("creates a versioned, timestamped backup without sharing references", () => {
    const templates = [{ id: "hello", name: "Hallo", text: "Hallo {mentions}" }];
    const backup = createDataExport(templates, "hello", [], [], DEFAULT_MODULE_SETTINGS, 0);
    expect(backup.format).toBe("pjl-viewertools-backup");
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBe("1970-01-01T00:00:00.000Z");
    templates[0]!.name = "Geändert";
    expect(backup.data.templates[0]!.name).toBe("Hallo");
  });

  it("validates and sanitizes a backup before importing", () => {
    const backup = createDataExport(
      [{ id: "hello", name: "Hallo", text: "Hi {mentions}" }],
      "missing",
      [{ username: "Anna", text: "nett", updatedAt: 1, expiresAt: 200 }],
      [],
      DEFAULT_MODULE_SETTINGS,
      100
    );
    const imported = parseDataImport(backup, 100);
    expect(imported?.activeTemplateId).toBe("hello");
    expect(imported?.notes[0]?.username).toBe("Anna");
  });

  it("rejects unrelated or unsupported JSON files", () => {
    expect(parseDataImport({ format: "other", version: 1 })).toBeNull();
    expect(parseDataImport({ format: "pjl-viewertools-backup", version: 2, data: {} })).toBeNull();
    expect(parseDataImport({ format: "pjl-viewertools-backup", version: 1, data: {} })).toBeNull();
  });
});
