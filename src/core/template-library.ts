import { DEFAULT_REPLY_TEMPLATE } from "./reply-template";

export interface SavedTemplate {
  id: string;
  name: string;
  text: string;
}

export const SUGGESTED_TEMPLATES: SavedTemplate[] = [
  { id: "hello", name: "Hallo", text: DEFAULT_REPLY_TEMPLATE },
  { id: "moin", name: "Moin", text: "Moin {mentions} 👋" },
  { id: "neutral", name: "Nur Mentions", text: "{mentions}" }
];

export function sanitizeTemplateLibrary(value: unknown): SavedTemplate[] {
  if (!Array.isArray(value)) return SUGGESTED_TEMPLATES.map((item) => ({ ...item }));
  const result: SavedTemplate[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<SavedTemplate>;
    const id = typeof candidate.id === "string" ? candidate.id.trim().slice(0, 80) : "";
    const name = typeof candidate.name === "string" ? candidate.name.trim().slice(0, 40) : "";
    const text = typeof candidate.text === "string" ? candidate.text.trim().slice(0, 300) : "";
    if (!id || !name || !text || ids.has(id)) continue;
    ids.add(id);
    result.push({ id, name, text });
  }
  return result.length > 0 ? result : SUGGESTED_TEMPLATES.map((item) => ({ ...item }));
}

export function upsertTemplate(library: readonly SavedTemplate[], template: SavedTemplate): SavedTemplate[] {
  const index = library.findIndex((item) => item.id === template.id);
  if (index < 0) return [...library, template];
  return library.map((item, itemIndex) => itemIndex === index ? template : item);
}
