import type { MentionHistoryEntry } from "./mention-history";
import type { ModuleSettings } from "./module-settings";
import type { SavedTemplate } from "./template-library";
import type { UserNote } from "./user-notes";
import { sanitizeMentionHistory } from "./mention-history";
import { sanitizeModuleSettings } from "./module-settings";
import { sanitizeTemplateLibrary } from "./template-library";
import { sanitizeUserNotes } from "./user-notes";

export interface PjlDataExport {
  format: "pjl-viewertools-backup";
  version: 1;
  exportedAt: string;
  data: {
    templates: SavedTemplate[];
    activeTemplateId: string;
    notes: UserNote[];
    mentionHistory: MentionHistoryEntry[];
    moduleSettings: ModuleSettings;
  };
}

export function createDataExport(
  templates: readonly SavedTemplate[],
  activeTemplateId: string,
  notes: readonly UserNote[],
  mentionHistory: readonly MentionHistoryEntry[],
  moduleSettings: ModuleSettings,
  now = Date.now()
): PjlDataExport {
  return {
    format: "pjl-viewertools-backup",
    version: 1,
    exportedAt: new Date(now).toISOString(),
    data: {
      templates: templates.map((item) => ({ ...item })),
      activeTemplateId,
      notes: notes.map((item) => ({ ...item })),
      mentionHistory: mentionHistory.map((item) => ({ ...item })),
      moduleSettings: { ...moduleSettings }
    }
  };
}

export function parseDataImport(value: unknown, now = Date.now()): PjlDataExport["data"] | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PjlDataExport>;
  if (candidate.format !== "pjl-viewertools-backup" || candidate.version !== 1) return null;
  if (!candidate.data || typeof candidate.data !== "object") return null;
  const data = candidate.data as Partial<PjlDataExport["data"]>;
  if (!Array.isArray(data.templates)
    || !Array.isArray(data.notes)
    || !Array.isArray(data.mentionHistory)
    || typeof data.activeTemplateId !== "string"
    || !data.moduleSettings
    || typeof data.moduleSettings !== "object") return null;
  const templates = sanitizeTemplateLibrary(data.templates);
  const requestedId = typeof data.activeTemplateId === "string" ? data.activeTemplateId : "";
  return {
    templates,
    activeTemplateId: templates.some((item) => item.id === requestedId) ? requestedId : templates[0]!.id,
    notes: sanitizeUserNotes(data.notes, now),
    mentionHistory: sanitizeMentionHistory(data.mentionHistory, now),
    moduleSettings: sanitizeModuleSettings(data.moduleSettings)
  };
}
