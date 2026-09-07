import { browser } from "wxt/browser";
import {
  DEFAULT_MODULE_SETTINGS,
  MODULE_SETTINGS_STORAGE_KEY,
  type ModuleSettings,
  sanitizeModuleSettings
} from "../../src/core/module-settings";
import {
  DEBUG_ENABLED_STORAGE_KEY,
  DEBUG_LOG_STORAGE_KEY,
  appendDebugLog,
  formatDebugLog,
  sanitizeDebugLog
} from "../../src/core/debug-log";
import "./style.css";

const MODULES: Array<{ key: keyof ModuleSettings; title: string; description: string }> = [
  { key: "activity", title: "Chat-Aktivität", description: "Zeigt Tempo und Anzahl aktiver Chatter der aktuellen Sitzung." },
  { key: "notes", title: "Private Notizen", description: "Erlaubt zeitlich begrenzte, nur lokal gespeicherte Notizen zu Nutzern." },
  { key: "mentionHistory", title: "Mention-Verlauf", description: "Merkt sich direkte Erwähnungen begrenzt auf 30 Tage und 100 Einträge." },
  { key: "search", title: "Chat-Suche", description: "Durchsucht Nachrichten der aktuellen Twitch-Sitzung." },
  { key: "filters", title: "Chatfilter", description: "Filtert die lokale Sitzungsansicht nach Text, Nutzern und Erwähnungen." }
];

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Options UI element missing: ${selector}`);
  return element;
}

const list = requireElement<HTMLDivElement>("#module-list");
const status = requireElement<HTMLParagraphElement>("#save-status");
const resetButton = requireElement<HTMLButtonElement>("#reset-modules");
const debugEnabled = requireElement<HTMLInputElement>("#debug-enabled");
const debugOutput = requireElement<HTMLTextAreaElement>("#debug-output");
const debugStatus = requireElement<HTMLParagraphElement>("#debug-status");
const copyDebug = requireElement<HTMLButtonElement>("#copy-debug");
const clearDebug = requireElement<HTMLButtonElement>("#clear-debug");

let settings = { ...DEFAULT_MODULE_SETTINGS };
let statusTimer: ReturnType<typeof setTimeout> | undefined;

async function refreshDebugLog() {
  const stored = await browser.storage.local.get([DEBUG_ENABLED_STORAGE_KEY, DEBUG_LOG_STORAGE_KEY]);
  debugEnabled.checked = stored[DEBUG_ENABLED_STORAGE_KEY] === true;
  debugOutput.value = formatDebugLog(sanitizeDebugLog(stored[DEBUG_LOG_STORAGE_KEY]));
}

function showDebugStatus(message: string) {
  debugStatus.textContent = message;
  window.setTimeout(() => { debugStatus.textContent = ""; }, 2500);
}

function showStatus(message: string) {
  status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { status.textContent = ""; }, 2500);
}

async function persist(next: ModuleSettings) {
  settings = next;
  await browser.storage.local.set({ [MODULE_SETTINGS_STORAGE_KEY]: settings });
  showStatus("Gespeichert");
}

function render() {
  list.replaceChildren(...MODULES.map(({ key, title, description }) => {
    const label = document.createElement("label");
    label.className = "module-row";

    const copy = document.createElement("span");
    copy.className = "module-copy";
    const name = document.createElement("strong");
    name.textContent = title;
    const detail = document.createElement("span");
    detail.textContent = description;
    copy.append(name, detail);

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = settings[key];
    toggle.setAttribute("aria-label", `${title} aktivieren`);
    toggle.addEventListener("change", () => {
      void persist({ ...settings, [key]: toggle.checked });
    });

    label.append(copy, toggle);
    return label;
  }));
}

resetButton.addEventListener("click", () => {
  void persist({ ...DEFAULT_MODULE_SETTINGS }).then(render);
});

debugEnabled.addEventListener("change", () => {
  void browser.storage.local.set({ [DEBUG_ENABLED_STORAGE_KEY]: debugEnabled.checked }).then(async () => {
    if (debugEnabled.checked) await appendDebugLog("options", "debug-enabled");
    await refreshDebugLog();
    showDebugStatus(debugEnabled.checked ? "Debug-Modus aktiviert" : "Debug-Modus deaktiviert");
  });
});

copyDebug.addEventListener("click", () => {
  const text = debugOutput.value || "Keine Debug-Einträge vorhanden.";
  void navigator.clipboard.writeText(text).then(
    () => showDebugStatus("Protokoll kopiert"),
    () => {
      debugOutput.focus();
      debugOutput.select();
      document.execCommand("copy");
      showDebugStatus("Protokoll kopiert");
    }
  );
});

clearDebug.addEventListener("click", () => {
  void browser.storage.local.remove(DEBUG_LOG_STORAGE_KEY).then(() => {
    debugOutput.value = "";
    showDebugStatus("Protokoll gelöscht");
  });
});

void browser.storage.local.get(MODULE_SETTINGS_STORAGE_KEY).then((stored) => {
  settings = sanitizeModuleSettings(stored[MODULE_SETTINGS_STORAGE_KEY]);
  render();
});
void refreshDebugLog();

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[DEBUG_LOG_STORAGE_KEY]) void refreshDebugLog();
});
