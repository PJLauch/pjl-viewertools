import { describe, expect, it } from "vitest";
import { sanitizeTemplateLibrary, SUGGESTED_TEMPLATES, upsertTemplate } from "../src/core/template-library";

describe("template library", () => {
  it("uses editable suggestions when no library exists", () => {
    expect(sanitizeTemplateLibrary(undefined)).toEqual(SUGGESTED_TEMPLATES);
  });

  it("drops malformed and duplicate templates", () => {
    expect(sanitizeTemplateLibrary([
      { id: "one", name: "One", text: "Hi {mentions}" },
      { id: "one", name: "Duplicate", text: "No" },
      { id: "", name: "Broken", text: "No" }
    ])).toEqual([{ id: "one", name: "One", text: "Hi {mentions}" }]);
  });

  it("updates an existing template", () => {
    expect(upsertTemplate([{ id: "one", name: "One", text: "Old" }], {
      id: "one", name: "New name", text: "New"
    })).toEqual([{ id: "one", name: "New name", text: "New" }]);
  });
});
