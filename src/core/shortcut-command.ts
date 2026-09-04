export const SHORTCUT_COMMANDS = [
  "toggle-panel",
  "toggle-user-selection",
  "choose-note-user"
] as const;

export type ShortcutCommand = typeof SHORTCUT_COMMANDS[number];

export interface ShortcutMessage {
  type: "pjl-shortcut";
  command: ShortcutCommand;
}

export interface ShortcutInfo {
  name: ShortcutCommand;
  shortcut: string;
}

export type ShortcutControlMessage =
  | { type: "pjl-get-shortcuts" }
  | { type: "pjl-open-shortcut-settings" };

export function isShortcutCommand(value: unknown): value is ShortcutCommand {
  return typeof value === "string" && SHORTCUT_COMMANDS.includes(value as ShortcutCommand);
}

export function isShortcutMessage(value: unknown): value is ShortcutMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ShortcutMessage>;
  return candidate.type === "pjl-shortcut" && isShortcutCommand(candidate.command);
}

export function isShortcutControlMessage(value: unknown): value is ShortcutControlMessage {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return type === "pjl-get-shortcuts" || type === "pjl-open-shortcut-settings";
}
