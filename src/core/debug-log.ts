import { browser } from "wxt/browser";

export const DEBUG_ENABLED_STORAGE_KEY = "debugLoggingEnabled";
export const DEBUG_LOG_STORAGE_KEY = "debugLogEntries";
export const DEBUG_LOG_LIMIT = 100;

export interface DebugLogEntry {
  timestamp: number;
  scope: string;
  event: string;
  details: Record<string, string | number | boolean | null>;
}

let debugWriteQueue: Promise<void> = Promise.resolve();

export function sanitizeDebugLog(value: unknown): DebugLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DebugLogEntry[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<DebugLogEntry>;
    if (!Number.isFinite(candidate.timestamp)
      || typeof candidate.scope !== "string"
      || typeof candidate.event !== "string") return [];
    return [{
      timestamp: candidate.timestamp as number,
      scope: candidate.scope.slice(0, 40),
      event: candidate.event.slice(0, 80),
      details: sanitizeDetails(candidate.details)
    }];
  }).slice(-DEBUG_LOG_LIMIT);
}

export async function appendDebugLog(
  scope: string,
  event: string,
  details: Record<string, string | number | boolean | null> = {}
): Promise<void> {
  debugWriteQueue = debugWriteQueue.catch(() => undefined).then(async () => {
    const stored = await browser.storage.local.get([DEBUG_ENABLED_STORAGE_KEY, DEBUG_LOG_STORAGE_KEY]);
    if (stored[DEBUG_ENABLED_STORAGE_KEY] !== true) return;
    const entries = sanitizeDebugLog(stored[DEBUG_LOG_STORAGE_KEY]);
    entries.push({
      timestamp: Date.now(),
      scope: scope.slice(0, 40),
      event: event.slice(0, 80),
      details: sanitizeDetails(details)
    });
    await browser.storage.local.set({ [DEBUG_LOG_STORAGE_KEY]: entries.slice(-DEBUG_LOG_LIMIT) });
  });
  await debugWriteQueue;
}

export function formatDebugLog(entries: readonly DebugLogEntry[]): string {
  return entries.map((entry) => {
    const time = new Date(entry.timestamp).toISOString();
    const details = Object.keys(entry.details).length > 0 ? ` ${JSON.stringify(entry.details)}` : "";
    return `[${time}] ${entry.scope}: ${entry.event}${details}`;
  }).join("\n");
}

function sanitizeDetails(value: unknown): DebugLogEntry["details"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean" && item !== null) return [];
    return [[key.slice(0, 40), typeof item === "string" ? item.slice(0, 300) : item]];
  }));
}
