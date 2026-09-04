import { browser } from "wxt/browser";
import {
  DEFAULT_MODULE_SETTINGS,
  MODULE_SETTINGS_STORAGE_KEY,
  type ModuleSettings,
  sanitizeModuleSettings
} from "../../src/core/module-settings";
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

let settings = { ...DEFAULT_MODULE_SETTINGS };
let statusTimer: ReturnType<typeof setTimeout> | undefined;

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

void browser.storage.local.get(MODULE_SETTINGS_STORAGE_KEY).then((stored) => {
  settings = sanitizeModuleSettings(stored[MODULE_SETTINGS_STORAGE_KEY]);
  render();
});
