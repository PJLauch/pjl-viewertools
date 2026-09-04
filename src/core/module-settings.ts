export interface ModuleSettings {
  activity: boolean;
  notes: boolean;
  mentionHistory: boolean;
  search: boolean;
  filters: boolean;
}

export const DEFAULT_MODULE_SETTINGS: ModuleSettings = {
  activity: true,
  notes: true,
  mentionHistory: true,
  search: true,
  filters: true
};

export function sanitizeModuleSettings(value: unknown): ModuleSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_MODULE_SETTINGS };
  const candidate = value as Partial<ModuleSettings>;
  return {
    activity: typeof candidate.activity === "boolean" ? candidate.activity : true,
    notes: typeof candidate.notes === "boolean" ? candidate.notes : true,
    mentionHistory: typeof candidate.mentionHistory === "boolean" ? candidate.mentionHistory : true,
    search: typeof candidate.search === "boolean" ? candidate.search : true,
    filters: typeof candidate.filters === "boolean" ? candidate.filters : true
  };
}
