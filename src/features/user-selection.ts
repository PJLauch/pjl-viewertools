import { classifyCandidate, isKnownBot } from "../core/candidates";
import type { CandidateReason } from "../core/candidates";
import { addInboxEntry } from "../core/inbox";
import type { InboxEntry } from "../core/inbox";
import { DEFAULT_REPLY_TEMPLATE, formatReplyTemplate } from "../core/reply-template";
import { sanitizeTemplateLibrary, SUGGESTED_TEMPLATES, upsertTemplate } from "../core/template-library";
import type { SavedTemplate } from "../core/template-library";
import { addChatHistory, conversationMessages, searchChatHistory } from "../core/chat-history";
import type { SessionMessage } from "../core/chat-history";
import type { ConversationRelation } from "../core/chat-history";
import { calculateChatActivity } from "../core/activity";
import type { ActivityLevel } from "../core/activity";
import { removeUserNote, sanitizeUserNotes, saveUserNote } from "../core/user-notes";
import type { UserNote } from "../core/user-notes";
import type { ComposerChange } from "../core/composer-draft";
import { addMentionHistoryEntry, sanitizeMentionHistory } from "../core/mention-history";
import type { MentionHistoryEntry } from "../core/mention-history";
import {
  DEFAULT_MODULE_SETTINGS,
  MODULE_SETTINGS_STORAGE_KEY,
  sanitizeModuleSettings
} from "../core/module-settings";
import type { ModuleSettings } from "../core/module-settings";
import { isShortcutMessage } from "../core/shortcut-command";
import type { ShortcutInfo } from "../core/shortcut-command";
import { filterSessionMessages } from "../core/chat-filter";
import type { ChatFilterMode } from "../core/chat-filter";
import { createDataExport, parseDataImport } from "../core/data-export";
import type { ChatAdapter } from "../platform/chat-adapter";
import { browser } from "wxt/browser";

const TEMPLATE_LIBRARY_KEY = "replyTemplates";
const ACTIVE_TEMPLATE_KEY = "activeReplyTemplateId";
const LEGACY_TEMPLATE_KEY = "replyTemplate";
const USER_NOTES_KEY = "temporaryUserNotes";
const MENTION_HISTORY_KEY = "mentionHistory";
const MODULE_SETTINGS_KEY = MODULE_SETTINGS_STORAGE_KEY;
const PERSISTENT_STORAGE_KEYS = [
  TEMPLATE_LIBRARY_KEY,
  ACTIVE_TEMPLATE_KEY,
  LEGACY_TEMPLATE_KEY,
  USER_NOTES_KEY,
  MENTION_HISTORY_KEY,
  MODULE_SETTINGS_KEY
];

export function mountUserSelection(adapter: ChatAdapter): () => void {
  const ownerAttribute = "data-pjl-viewertools-owner";
  const instanceId = crypto.randomUUID();
  document.documentElement.setAttribute(ownerAttribute, instanceId);
  document.querySelectorAll('[data-tpt-root="selection"]').forEach((element) => element.remove());

  const selected = new Map<string, { username: string; reason: CandidateReason | "manual" }>();
  let inbox: InboxEntry[] = [];
  let savedForLater: InboxEntry[] = [];
  let chatHistory: SessionMessage[] = [];
  let conversationUsername: string | null = null;
  let searchQuery = "";
  let activityRenderTimer: number | null = null;
  let notes: UserNote[] = [];
  let noteUsername = "";
  let noteText = "";
  let noteDurationDays = 7;
  let noteSelectionMode = false;
  let lastComposerChange: ComposerChange | null = null;
  let undoMessage = "";
  let mentionHistory: MentionHistoryEntry[] = [];
  let moduleSettings: ModuleSettings = { ...DEFAULT_MODULE_SETTINGS };
  let shortcutInfo: ShortcutInfo[] = [];
  let activeTool: "inbox" | "later" | "notes" | "history" | "search" | "filters" | "settings" | null = null;
  let templateOpen = false;
  let dataStatus = "";
  let filterMode: ChatFilterMode = "mentions";
  let filterQuery = "";
  let filterHideBots = true;
  let selectionMode = false;
  let autoCollect = true;
  let panelOpen = false;
  let greetingWindowUntil = 0;
  let templates: SavedTemplate[] = SUGGESTED_TEMPLATES.map((item) => ({ ...item }));
  let activeTemplateId = templates[0]!.id;
  let templateName = templates[0]!.name;
  let replyTemplate = templates[0]!.text;
  let unreadInboxCount = 0;
  let inboxExpanded = false;
  let stopped = false;
  let stopClicks = () => {};
  let stopMessages = () => {};
  let stopShortcuts = () => {};
  let stopSettingsSync = () => {};

  const shell = document.createElement("div");
  shell.dataset.tptRoot = "selection";
  shell.className = "tpt-shell";
  shell.setAttribute("aria-label", "PJL ViewerTools Nutzerauswahl");

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "tpt-launcher";
  launcher.textContent = "PJL";
  launcher.title = "PJL ViewerTools öffnen";
  launcher.setAttribute("aria-expanded", "false");

  const panel = document.createElement("section");
  panel.className = "tpt-selection";

  const appendInbox = () => {
    if (activeTool !== "inbox") return;
    const inboxHeading = document.createElement("strong");
    inboxHeading.className = "tpt-heading tpt-heading--inbox";
    inboxHeading.textContent = "Letzte erkannte Nachrichten";
    const inboxList = document.createElement("div");
    inboxList.className = "tpt-inbox";
    const visibleEntries = inboxExpanded ? inbox : inbox.slice(0, 5);
    for (const entry of visibleEntries) {
      const row = document.createElement("div");
      row.className = "tpt-inbox__row";
      const addToReply = document.createElement("button");
      addToReply.type = "button";
      addToReply.className = "tpt-inbox__content";
      addToReply.title = `${entry.username} zur Antwortliste hinzufügen`;
      const author = document.createElement("b");
      author.textContent = `@${entry.username}`;
      const reason = document.createElement("span");
      reason.className = "tpt-inbox__reason";
      reason.textContent = reasonLabel(entry.reason);
      const message = document.createElement("span");
      message.className = "tpt-inbox__message";
      message.textContent = entry.text || "(Antwort ohne sichtbaren Text)";
      addToReply.append(author, reason, message);
      addToReply.addEventListener("click", () => {
        selected.set(entry.username.toLocaleLowerCase("en-US"), {
          username: entry.username,
          reason: entry.reason
        });
        render();
      });
      const saveForLater = document.createElement("button");
      saveForLater.type = "button";
      saveForLater.className = "tpt-inbox__save";
      saveForLater.textContent = "☆";
      saveForLater.title = "Für später merken";
      saveForLater.setAttribute("aria-label", `${entry.username}: für später merken`);
      saveForLater.addEventListener("click", () => {
        savedForLater = addInboxEntry(savedForLater, entry, 20);
        render();
      });
      const showConversation = document.createElement("button");
      showConversation.type = "button";
      showConversation.className = "tpt-inbox__save";
      showConversation.textContent = "💬";
      showConversation.title = `Letzte Nachrichten von ${entry.username}`;
      showConversation.setAttribute("aria-label", `${entry.username}: Unterhaltung anzeigen`);
      showConversation.addEventListener("click", () => {
        conversationUsername = entry.username;
        render();
      });
      const addNote = document.createElement("button");
      addNote.type = "button";
      addNote.className = "tpt-inbox__save";
      addNote.textContent = "📝";
      addNote.title = `Private Notiz zu ${entry.username}`;
      addNote.addEventListener("click", () => {
        beginNote(entry.username);
      });
      row.append(addToReply, showConversation, addNote, saveForLater);
      inboxList.append(row);
    }
    const inboxActions = document.createElement("div");
    inboxActions.className = "tpt-inbox__actions";
    if (inbox.length > 5) {
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "tpt-clear";
      expand.textContent = inboxExpanded ? "Weniger anzeigen" : `Alle ${inbox.length} anzeigen`;
      expand.addEventListener("click", () => { inboxExpanded = !inboxExpanded; render(); });
      inboxActions.append(expand);
    }
    const clearInbox = document.createElement("button");
    clearInbox.type = "button";
    clearInbox.className = "tpt-clear";
    clearInbox.textContent = "Inbox leeren";
    clearInbox.addEventListener("click", () => {
      inbox = [];
      unreadInboxCount = 0;
      inboxExpanded = false;
      render();
    });
    inboxActions.append(clearInbox);
    panel.append(inboxHeading, inboxList, inboxActions);
  };

  const appendSavedForLater = () => {
    if (activeTool !== "later") return;
    const heading = document.createElement("strong");
    heading.className = "tpt-heading tpt-heading--inbox";
    heading.textContent = `Später antworten (${savedForLater.length})`;
    const list = document.createElement("div");
    list.className = "tpt-inbox";
    for (const entry of savedForLater) {
      const row = document.createElement("div");
      row.className = "tpt-inbox__row";
      const add = document.createElement("button");
      add.type = "button";
      add.className = "tpt-inbox__content";
      add.title = `${entry.username} zur Antwortliste hinzufügen`;
      const author = document.createElement("b");
      author.textContent = `@${entry.username}`;
      const message = document.createElement("span");
      message.className = "tpt-inbox__message";
      message.textContent = entry.text || "(Antwort ohne sichtbaren Text)";
      add.append(author, message);
      add.addEventListener("click", () => {
        selected.set(entry.username.toLocaleLowerCase("en-US"), {
          username: entry.username,
          reason: entry.reason
        });
        render();
      });
      const done = document.createElement("button");
      done.type = "button";
      done.className = "tpt-inbox__save";
      done.textContent = "✓";
      done.title = "Als erledigt entfernen";
      done.setAttribute("aria-label", `${entry.username}: als erledigt entfernen`);
      done.addEventListener("click", () => {
        savedForLater = savedForLater.filter((item) => item !== entry);
        render();
      });
      row.append(add, done);
      list.append(row);
    }
    panel.append(heading, list);
  };

  const appendConversation = () => {
    if (!conversationUsername) return;
    const currentUsername = adapter.getCurrentUsername();
    const messages = conversationMessages(chatHistory, conversationUsername, currentUsername, 16);
    const heading = document.createElement("div");
    heading.className = "tpt-conversation__heading";
    const title = document.createElement("strong");
    title.textContent = `Letzte Nachrichten von @${conversationUsername}`;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "tpt-clear";
    close.textContent = "Schließen";
    close.addEventListener("click", () => { conversationUsername = null; render(); });
    heading.append(title, close);
    const list = document.createElement("div");
    list.className = "tpt-conversation";
    if (messages.length === 0) {
      const empty = document.createElement("span");
      empty.className = "tpt-hint";
      empty.textContent = "Keine weiteren Nachrichten mehr im aktuellen Sitzungsspeicher.";
      list.append(empty);
    } else {
      for (const message of messages) {
        const item = document.createElement("div");
        item.className = "tpt-conversation__message";
        item.classList.toggle("tpt-conversation__message--own", message.own);
        const author = document.createElement("b");
        author.textContent = message.own ? "Du" : `@${message.username}`;
        const meta = document.createElement("span");
        meta.className = "tpt-conversation__meta";
        meta.textContent = `${conversationRelationLabel(message.relation)} · ${formatMessageTime(message.receivedAt)}`;
        const text = document.createElement("span");
        text.textContent = message.text;
        item.append(author, meta, text);
        list.append(item);
      }
    }
    panel.append(heading, list);
  };

  const appendSearch = () => {
    if (activeTool !== "search") return;

    const form = document.createElement("form");
    form.className = "tpt-search";
    const input = document.createElement("input");
    input.type = "search";
    input.value = searchQuery;
    input.placeholder = "Text oder @Nutzername";
    input.setAttribute("aria-label", "Aktuellen Chat durchsuchen");
    input.addEventListener("input", () => { searchQuery = input.value; });
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "tpt-chip";
    submit.textContent = "Suchen";
    form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
    form.append(input, submit);
    panel.append(form);

    const results = searchChatHistory(chatHistory, searchQuery, 20);
    if (searchQuery.trim().length >= 2 && results.length === 0) {
      const empty = document.createElement("span");
      empty.className = "tpt-hint";
      empty.textContent = "Keine Treffer im aktuellen Sitzungsspeicher.";
      panel.append(empty);
      return;
    }
    if (results.length === 0) return;
    const list = document.createElement("div");
    list.className = "tpt-search__results";
    for (const result of results) {
      const row = document.createElement("div");
      row.className = "tpt-search__result";
      const author = document.createElement("b");
      author.textContent = `@${result.username}`;
      const text = document.createElement("span");
      text.textContent = result.text;
      const actions = createResultActions(result.username, () => {
        selected.set(result.username.toLocaleLowerCase("en-US"), {
          username: result.username,
          reason: "manual"
        });
        render();
      });
      row.append(author, text, actions);
      list.append(row);
    }
    panel.append(list);
  };

  const appendActivity = () => {
    const activity = calculateChatActivity(chatHistory);
    const status = document.createElement("div");
    status.className = `tpt-activity tpt-activity--${activity.level}`;
    const dot = document.createElement("span");
    dot.className = "tpt-activity__dot";
    const label = document.createElement("strong");
    label.textContent = activityLabel(activity.level);
    const details = document.createElement("span");
    details.textContent = `${activity.messagesPerMinute} Nachrichten/min · ${activity.activeUsers} Personen`;
    status.append(dot, label, details);
    panel.append(status);
  };

  const appendModuleSettings = () => {
    if (activeTool !== "settings") return;

    const options = document.createElement("div");
    options.className = "tpt-module-settings";
    const definitions: Array<[keyof ModuleSettings, string]> = [
      ["activity", "Chat-Aktivität"],
      ["notes", "Private Notizen"],
      ["mentionHistory", "Mention-Verlauf"],
      ["search", "Chat-Suche"],
      ["filters", "Chatfilter"]
    ];
    for (const [key, labelText] of definitions) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = moduleSettings[key];
      checkbox.addEventListener("change", () => {
        moduleSettings = { ...moduleSettings, [key]: checkbox.checked };
        void browser.storage.local.set({ [MODULE_SETTINGS_KEY]: moduleSettings });
        render();
      });
      label.append(checkbox, document.createTextNode(labelText));
      options.append(label);
    }
    panel.append(options);
    const openSettings = document.createElement("button");
    openSettings.type = "button";
    openSettings.className = "tpt-chip tpt-open-settings";
    openSettings.textContent = "Große Einstellungsseite öffnen";
    openSettings.addEventListener("click", () => {
      void browser.runtime.openOptionsPage();
    });
    panel.append(openSettings);
    const hint = document.createElement("span");
    hint.className = "tpt-shortcuts";
    hint.textContent = shortcutSummary(shortcutInfo);
    const editShortcuts = document.createElement("button");
    editShortcuts.type = "button";
    editShortcuts.className = "tpt-clear tpt-shortcuts__edit";
    editShortcuts.textContent = "Browser-Kürzel ändern";
    editShortcuts.addEventListener("click", () => {
      void browser.runtime.sendMessage({ type: "pjl-open-shortcut-settings" });
    });
    panel.append(hint, editShortcuts);

    const privacy = document.createElement("div");
    privacy.className = "tpt-privacy";
    const title = document.createElement("strong");
    title.textContent = "Lokale Daten";
    const summary = document.createElement("span");
    summary.textContent = `${templates.length} Vorlagen · ${notes.length} Notizen · ${mentionHistory.length} Mentions`;
    const explanation = document.createElement("span");
    explanation.textContent = "Nur auf diesem Gerät gespeichert. Keine Übertragung an PJL oder andere Dienste.";
    const actions = document.createElement("div");
    const exportData = document.createElement("button");
    exportData.type = "button";
    exportData.className = "tpt-chip";
    exportData.textContent = "Sicherung herunterladen";
    exportData.addEventListener("click", () => {
      const backup = createDataExport(templates, activeTemplateId, notes, mentionHistory, moduleSettings);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pjl-viewertools-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const clearData = document.createElement("button");
    clearData.type = "button";
    clearData.className = "tpt-danger";
    clearData.textContent = "Lokale Daten löschen";
    clearData.addEventListener("click", () => {
      if (!window.confirm("Alle gespeicherten PJL-Vorlagen, Notizen, Mentions und Einstellungen auf diesem Gerät löschen?")) return;
      void browser.storage.local.remove(PERSISTENT_STORAGE_KEYS).then(() => {
        templates = SUGGESTED_TEMPLATES.map((item) => ({ ...item }));
        const fallback = templates[0]!;
        activeTemplateId = fallback.id;
        templateName = fallback.name;
        replyTemplate = fallback.text;
        notes = [];
        mentionHistory = [];
        moduleSettings = { ...DEFAULT_MODULE_SETTINGS };
        activeTool = "settings";
        dataStatus = "Alle dauerhaft gespeicherten PJL-Daten wurden gelöscht.";
        render();
      });
    });
    const importData = document.createElement("button");
    importData.type = "button";
    importData.className = "tpt-chip";
    importData.textContent = "Sicherung importieren";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json,.json";
    fileInput.hidden = true;
    importData.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      void file.text().then((content) => {
        let decoded: unknown;
        try {
          decoded = JSON.parse(content);
        } catch {
          dataStatus = "Import abgelehnt: Die Datei enthält kein gültiges JSON.";
          render();
          return;
        }
        const imported = parseDataImport(decoded);
        if (!imported) {
          dataStatus = "Import abgelehnt: Keine unterstützte PJL-Sicherung.";
          render();
          return;
        }
        if (!window.confirm("Diese Sicherung importieren und die derzeit gespeicherten PJL-Daten ersetzen?")) return;
        templates = imported.templates;
        activeTemplateId = imported.activeTemplateId;
        const active = templates.find((item) => item.id === activeTemplateId) ?? templates[0]!;
        templateName = active.name;
        replyTemplate = active.text;
        notes = imported.notes;
        mentionHistory = imported.mentionHistory;
        moduleSettings = imported.moduleSettings;
        void browser.storage.local.set({
          [TEMPLATE_LIBRARY_KEY]: templates,
          [ACTIVE_TEMPLATE_KEY]: activeTemplateId,
          [USER_NOTES_KEY]: notes,
          [MENTION_HISTORY_KEY]: mentionHistory,
          [MODULE_SETTINGS_KEY]: moduleSettings
        }).then(() => {
          dataStatus = "PJL-Sicherung wurde erfolgreich importiert.";
          activeTool = "settings";
          render();
        });
      }).catch(() => {
        dataStatus = "Import fehlgeschlagen: Die Datei konnte nicht gelesen werden.";
        render();
      });
    });
    actions.append(exportData, importData, clearData, fileInput);
    privacy.append(title, summary, explanation, actions);
    if (dataStatus) {
      const status = document.createElement("span");
      status.className = "tpt-data-status";
      status.setAttribute("role", "status");
      status.textContent = dataStatus;
      privacy.append(status);
    }
    panel.append(privacy);
  };

  const appendFilters = () => {
    if (activeTool !== "filters") return;

    const controls = document.createElement("div");
    controls.className = "tpt-filter-controls";
    const mode = document.createElement("select");
    mode.setAttribute("aria-label", "Chatfilter auswählen");
    for (const [value, label] of [["mentions", "Mentions an mich"], ["text", "Nach Text"], ["user", "Nach Nutzer"]] as const) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = filterMode === value;
      mode.append(option);
    }
    mode.addEventListener("change", () => { filterMode = mode.value as ChatFilterMode; render(); });
    const query = document.createElement("input");
    query.type = "search";
    query.value = filterQuery;
    query.placeholder = filterMode === "user" ? "Nutzername" : "Suchtext";
    query.disabled = filterMode === "mentions";
    query.setAttribute("aria-label", "Wert für den Chatfilter");
    query.addEventListener("input", () => { filterQuery = query.value; });
    query.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); render(); }
    });
    const botLabel = document.createElement("label");
    botLabel.className = "tpt-filter-bots";
    const bots = document.createElement("input");
    bots.type = "checkbox";
    bots.checked = filterHideBots;
    bots.addEventListener("change", () => { filterHideBots = bots.checked; render(); });
    botLabel.append(bots, document.createTextNode("Bekannte Bots ausblenden"));
    controls.append(mode, query, botLabel);
    panel.append(controls);

    const results = filterSessionMessages(chatHistory, {
      mode: filterMode,
      query: filterQuery,
      hideKnownBots: filterHideBots
    }, adapter.getCurrentUsername(), 30);
    const list = document.createElement("div");
    list.className = "tpt-filter-results";
    if (results.length === 0) {
      const empty = document.createElement("span");
      empty.className = "tpt-hint";
      empty.textContent = filterMode !== "mentions" && filterQuery.trim().length < 2
        ? "Mindestens zwei Zeichen eingeben."
        : "Keine passenden Nachrichten in dieser Twitch-Sitzung.";
      list.append(empty);
    }
    for (const result of results) {
      const row = document.createElement("div");
      row.className = "tpt-filter-result";
      const author = document.createElement("b");
      author.textContent = `@${result.username}`;
      const message = document.createElement("span");
      message.textContent = result.text;
      const actions = createResultActions(result.username, () => {
        selected.set(result.username.toLocaleLowerCase("en-US"), { username: result.username, reason: "manual" });
        render();
      });
      row.append(author, message, actions);
      list.append(row);
    }
    panel.append(list);
  };

  const persistMentionHistory = () => void browser.storage.local.set({ [MENTION_HISTORY_KEY]: mentionHistory });

  const appendMentionHistory = () => {
    if (activeTool !== "history") return;

    if (mentionHistory.length === 0) {
      const empty = document.createElement("span");
      empty.className = "tpt-hint";
      empty.textContent = "Noch keine direkten Erwähnungen oder Antworten gespeichert.";
      panel.append(empty);
      return;
    }
    const list = document.createElement("div");
    list.className = "tpt-history";
    for (const entry of mentionHistory.slice(0, 20)) {
      const row = document.createElement("div");
      row.className = "tpt-history__entry";
      const author = document.createElement("b");
      author.textContent = `@${entry.username}`;
      const meta = document.createElement("span");
      meta.textContent = `${entry.reason === "reply" ? "Antwort" : "Erwähnung"} · #${entry.channel} · ${formatHistoryTime(entry.receivedAt)}`;
      const message = document.createElement("span");
      message.textContent = entry.text;
      const actions = createResultActions(entry.username, () => {
        selected.set(entry.username.toLocaleLowerCase("en-US"), { username: entry.username, reason: entry.reason });
        render();
      });
      row.append(author, meta, message, actions);
      list.append(row);
    }
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "tpt-clear";
    clear.textContent = "Mention-Verlauf löschen";
    clear.addEventListener("click", () => { mentionHistory = []; persistMentionHistory(); render(); });
    panel.append(list, clear);
  };

  const persistNotes = () => void browser.storage.local.set({ [USER_NOTES_KEY]: notes });

  const createResultActions = (username: string, add: () => void): HTMLDivElement => {
    const actions = document.createElement("div");
    actions.className = "tpt-result-actions";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Antwortliste";
    addButton.title = `${username} zur Antwortliste hinzufügen`;
    addButton.addEventListener("click", add);
    const conversation = document.createElement("button");
    conversation.type = "button";
    conversation.textContent = "Unterhaltung";
    conversation.title = `Unterhaltung mit ${username} anzeigen`;
    conversation.addEventListener("click", () => {
      conversationUsername = username;
      activeTool = null;
      render();
    });
    actions.append(addButton, conversation);
    return actions;
  };

  const beginNote = (username: string) => {
    const existing = notes.find((item) => item.username.toLocaleLowerCase("en-US") === username.toLocaleLowerCase("en-US"));
    activeTool = "notes";
    noteUsername = username;
    noteText = existing?.text ?? "";
    render();
  };

  const appendNotes = () => {
    if (activeTool !== "notes") return;

    const editor = document.createElement("div");
    editor.className = "tpt-note-editor";
    const chooseUser = document.createElement("button");
    chooseUser.type = "button";
    chooseUser.className = noteSelectionMode ? "tpt-action" : "tpt-chip";
    chooseUser.setAttribute("aria-pressed", String(noteSelectionMode));
    chooseUser.textContent = noteSelectionMode ? "Jetzt Namen anklicken …" : "Nutzer im Chat wählen";
    chooseUser.title = "Danach einmal auf einen Nutzernamen im Twitch-Chat klicken";
    chooseUser.addEventListener("click", () => {
      noteSelectionMode = !noteSelectionMode;
      if (noteSelectionMode) selectionMode = false;
      render();
    });
    const username = document.createElement("input");
    username.value = noteUsername;
    username.maxLength = 40;
    username.placeholder = "Nutzername";
    username.setAttribute("aria-label", "Nutzername für die Notiz");
    username.addEventListener("input", () => { noteUsername = username.value; });
    const text = document.createElement("textarea");
    text.value = noteText;
    text.maxLength = 300;
    text.rows = 2;
    text.placeholder = "Private Notiz (nur lokal gespeichert)";
    text.setAttribute("aria-label", "Private Notiz");
    text.addEventListener("input", () => { noteText = text.value; });
    const duration = document.createElement("select");
    duration.setAttribute("aria-label", "Notiz behalten für");
    for (const [days, label] of [[1, "1 Tag"], [7, "7 Tage"], [30, "30 Tage"]] as const) {
      const option = document.createElement("option");
      option.value = String(days);
      option.textContent = label;
      option.selected = days === noteDurationDays;
      duration.append(option);
    }
    duration.addEventListener("change", () => { noteDurationDays = Number(duration.value); });
    const save = document.createElement("button");
    save.type = "button";
    save.className = "tpt-action";
    save.textContent = "Notiz speichern";
    save.addEventListener("click", () => {
      notes = saveUserNote(notes, noteUsername, noteText, noteDurationDays);
      noteUsername = "";
      noteText = "";
      persistNotes();
      render();
    });
    editor.append(chooseUser, username, text, duration, save);
    panel.append(editor);

    const list = document.createElement("div");
    list.className = "tpt-notes";
    for (const note of notes) {
      const row = document.createElement("div");
      row.className = "tpt-note";
      const content = document.createElement("button");
      content.type = "button";
      content.className = "tpt-note__content";
      content.title = "Notiz bearbeiten";
      content.textContent = `@${note.username}: ${note.text}`;
      content.addEventListener("click", () => beginNote(note.username));
      const expiry = document.createElement("span");
      expiry.textContent = `noch ${remainingDays(note.expiresAt)} T.`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tpt-inbox__save";
      remove.textContent = "×";
      remove.title = `Notiz zu ${note.username} löschen`;
      remove.addEventListener("click", () => { notes = removeUserNote(notes, note.username); persistNotes(); render(); });
      row.append(content, expiry, remove);
      list.append(row);
    }
    if (notes.length > 0) panel.append(list);
  };

  const appendToolMenu = () => {
    const menu = document.createElement("nav");
    menu.className = "tpt-tool-menu";
    menu.setAttribute("aria-label", "PJL Werkzeuge");
    const tools: Array<[typeof activeTool, string, boolean]> = [
      ["inbox", `Inbox ${inbox.length}`, true],
      ["later", `Später ${savedForLater.length}`, true],
      ["notes", `Notizen ${notes.length}`, moduleSettings.notes],
      ["history", `Verlauf ${mentionHistory.length}`, moduleSettings.mentionHistory],
      ["search", "Suche", moduleSettings.search],
      ["filters", "Filter", moduleSettings.filters],
      ["settings", "Einstellungen", true]
    ];
    for (const [id, label, enabled] of tools) {
      if (!id || !enabled) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = activeTool === id ? "tpt-tool-menu__button tpt-tool-menu__button--active" : "tpt-tool-menu__button";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(activeTool === id));
      button.addEventListener("click", () => { activeTool = activeTool === id ? null : id; render(); });
      menu.append(button);
    }
    panel.append(menu);
  };

  const render = () => {
    panel.replaceChildren();
    panel.hidden = !panelOpen;
    launcher.setAttribute("aria-expanded", String(panelOpen));
    launcher.classList.toggle("tpt-launcher--active", panelOpen || selected.size > 0);
    const selectionPart = selected.size > 0 ? ` ${selected.size}` : "";
    const unreadPart = unreadInboxCount > 0 ? ` · +${unreadInboxCount}` : "";
    launcher.textContent = `PJL${selectionPart}${unreadPart}`;
    launcher.setAttribute(
      "aria-label",
      unreadInboxCount > 0
        ? `PJL ViewerTools öffnen, ${unreadInboxCount} neue Nachrichten`
        : "PJL ViewerTools öffnen"
    );
    const heading = document.createElement("strong");
    heading.className = "tpt-heading";
    heading.textContent = "Antwortliste";
    panel.append(heading);
    if (moduleSettings.activity) appendActivity();
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = selectionMode ? "tpt-action" : "tpt-chip";
    toggle.setAttribute("aria-pressed", String(selectionMode));
    toggle.textContent = selectionMode ? "Auswahl aktiv" : "Nutzer auswählen";
    toggle.title = selectionMode
      ? "Nutzernamen im Chat anklicken; danach Auswahl beenden"
      : "Auswahlmodus starten";
    toggle.addEventListener("click", () => { selectionMode = !selectionMode; render(); });
    const automatic = document.createElement("button");
    automatic.type = "button";
    automatic.className = autoCollect ? "tpt-auto tpt-auto--active" : "tpt-auto";
    automatic.setAttribute("aria-pressed", String(autoCollect));
    automatic.textContent = autoCollect ? "Automatisch: an" : "Automatisch: aus";
    automatic.title = "Begrüßungen, Erwähnungen und Antworten automatisch sammeln";
    automatic.addEventListener("click", () => { autoCollect = !autoCollect; render(); });
    panel.append(toggle, automatic);
    const templateToggle = document.createElement("button");
    templateToggle.type = "button";
    templateToggle.className = "tpt-template-toggle";
    templateToggle.textContent = `${templateOpen ? "▾" : "▸"} Vorlage: ${templateName}`;
    templateToggle.setAttribute("aria-expanded", String(templateOpen));
    templateToggle.addEventListener("click", () => { templateOpen = !templateOpen; render(); });
    panel.append(templateToggle);
    if (templateOpen) {
    const templateControls = document.createElement("div");
    templateControls.className = "tpt-template";
    const templateSelect = document.createElement("select");
    templateSelect.setAttribute("aria-label", "Gespeicherte Antwortvorlage");
    for (const template of templates) {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      option.selected = template.id === activeTemplateId;
      templateSelect.append(option);
    }
    templateSelect.addEventListener("change", () => {
      const chosen = templates.find((item) => item.id === templateSelect.value);
      if (!chosen) return;
      activeTemplateId = chosen.id;
      templateName = chosen.name;
      replyTemplate = chosen.text;
      void browser.storage.local.set({ [ACTIVE_TEMPLATE_KEY]: activeTemplateId });
      render();
    });
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = templateName;
    nameInput.maxLength = 40;
    nameInput.placeholder = "Vorlagenname";
    nameInput.setAttribute("aria-label", "Name der Antwortvorlage");
    nameInput.addEventListener("input", () => { templateName = nameInput.value; });
    const templateInput = document.createElement("input");
    templateInput.type = "text";
    templateInput.value = replyTemplate;
    templateInput.maxLength = 300;
    templateInput.placeholder = DEFAULT_REPLY_TEMPLATE;
    templateInput.setAttribute("aria-label", "Antwortvorlage; {mentions} wird durch Namen ersetzt");
    templateInput.addEventListener("input", () => { replyTemplate = templateInput.value; });
    const templateActions = document.createElement("div");
    templateActions.className = "tpt-template__actions";
    const saveTemplate = document.createElement("button");
    saveTemplate.type = "button";
    saveTemplate.className = "tpt-chip";
    saveTemplate.textContent = "Speichern";
    saveTemplate.addEventListener("click", () => {
      const saved: SavedTemplate = {
        id: activeTemplateId,
        name: templateName.trim() || "Eigene Vorlage",
        text: replyTemplate.trim() || "{mentions}"
      };
      templates = upsertTemplate(templates, saved);
      templateName = saved.name;
      replyTemplate = saved.text;
      void browser.storage.local.set({
        [TEMPLATE_LIBRARY_KEY]: templates,
        [ACTIVE_TEMPLATE_KEY]: activeTemplateId
      });
      render();
    });
    const newTemplate = document.createElement("button");
    newTemplate.type = "button";
    newTemplate.className = "tpt-clear";
    newTemplate.textContent = "Neu";
    newTemplate.addEventListener("click", () => {
      activeTemplateId = crypto.randomUUID();
      templateName = "Eigene Vorlage";
      replyTemplate = "{mentions}";
      render();
    });
    const deleteTemplate = document.createElement("button");
    deleteTemplate.type = "button";
    deleteTemplate.className = "tpt-clear";
    deleteTemplate.textContent = "Löschen";
    deleteTemplate.addEventListener("click", () => {
      templates = templates.filter((item) => item.id !== activeTemplateId);
      if (templates.length === 0) templates = SUGGESTED_TEMPLATES.map((item) => ({ ...item }));
      const fallback = templates[0]!;
      activeTemplateId = fallback.id;
      templateName = fallback.name;
      replyTemplate = fallback.text;
      void browser.storage.local.set({
        [TEMPLATE_LIBRARY_KEY]: templates,
        [ACTIVE_TEMPLATE_KEY]: activeTemplateId
      });
      render();
    });
    templateActions.append(saveTemplate, newTemplate, deleteTemplate);
    templateControls.append(templateSelect, nameInput, templateInput, templateActions);
    panel.append(templateControls);
    }
    appendToolMenu();
    appendModuleSettings();
    if (moduleSettings.notes) appendNotes();
    if (moduleSettings.mentionHistory) appendMentionHistory();
    if (moduleSettings.search) appendSearch();
    if (moduleSettings.filters) appendFilters();
    appendInbox();
    appendSavedForLater();
    appendConversation();
    if (lastComposerChange) {
      const undo = document.createElement("button");
      undo.type = "button";
      undo.className = "tpt-undo";
      undo.textContent = "↶ Einfügen rückgängig";
      undo.title = "Vorherigen Twitch-Entwurf wiederherstellen";
      undo.addEventListener("click", () => {
        if (lastComposerChange && adapter.undoComposer(lastComposerChange)) {
          lastComposerChange = null;
          undoMessage = "Alter Entwurf wurde wiederhergestellt.";
        } else {
          lastComposerChange = null;
          undoMessage = "Nicht rückgängig gemacht: Das Schreibfeld wurde inzwischen verändert.";
        }
        render();
      });
      panel.append(undo);
    }
    if (undoMessage) {
      const status = document.createElement("span");
      status.className = "tpt-hint tpt-undo-status";
      status.setAttribute("role", "status");
      status.textContent = undoMessage;
      panel.append(status);
    }
    if (selected.size === 0) {
      const hint = document.createElement("span");
      hint.className = "tpt-hint";
      hint.textContent = selectionMode
        ? "Jetzt Namen im Chat anklicken"
        : "Begrüßer werden automatisch gesammelt";
      panel.append(hint);
      return;
    }
    const users = document.createElement("div");
    users.className = "tpt-selection__users";
    for (const [key, candidate] of selected) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tpt-chip";
      chip.textContent = `@${candidate.username} ×`;
      chip.title = `${candidate.username} entfernen · ${reasonLabel(candidate.reason)}`;
      chip.addEventListener("click", () => { selected.delete(key); render(); });
      users.append(chip);
    }
    const prepare = document.createElement("button");
    prepare.type = "button";
    prepare.className = "tpt-action";
    prepare.textContent = "Mentions vorbereiten";
    prepare.addEventListener("click", () => {
      const reply = formatReplyTemplate(
        replyTemplate,
        Array.from(selected.values(), (item) => item.username)
      );
      const change = adapter.writeComposer(reply);
      if (change) {
        lastComposerChange = change;
        undoMessage = "";
        selected.clear();
        render();
      }
    });
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "tpt-clear";
    clear.textContent = "Leeren";
    clear.addEventListener("click", () => { selected.clear(); render(); });
    panel.append(users, prepare, clear);

  };

  launcher.addEventListener("click", () => {
    panelOpen = !panelOpen;
    if (panelOpen) unreadInboxCount = 0;
    render();
  });
  const handleShortcut = (message: unknown) => {
    if (!isShortcutMessage(message)) return;
    if (message.command === "toggle-panel") {
      panelOpen = !panelOpen;
      if (panelOpen) unreadInboxCount = 0;
    } else if (message.command === "toggle-user-selection") {
      panelOpen = true;
      selectionMode = !selectionMode;
      noteSelectionMode = false;
      unreadInboxCount = 0;
    } else if (message.command === "choose-note-user") {
      panelOpen = true;
      activeTool = "notes";
      noteSelectionMode = !noteSelectionMode;
      selectionMode = false;
      unreadInboxCount = 0;
    }
    render();
  };
  browser.runtime.onMessage.addListener(handleShortcut);
  stopShortcuts = () => browser.runtime.onMessage.removeListener(handleShortcut);
  shell.append(launcher, panel);

  const mount = () => {
    if (document.documentElement.getAttribute(ownerAttribute) !== instanceId) {
      cleanup();
      return;
    }
    const point = adapter.getMountPoint();
    if (point && !shell.isConnected) point.insertBefore(shell, point.lastElementChild);
  };
  stopClicks = adapter.onUsernameClick((username) => {
    if (noteSelectionMode) {
      noteSelectionMode = false;
      beginNote(username);
      mount();
      return true;
    }
    if (!selectionMode) return false;
    const key = username.toLocaleLowerCase("en-US");
    selected.has(key)
      ? selected.delete(key)
      : selected.set(key, { username, reason: "manual" });
    mount();
    render();
    return true;
  });
  stopMessages = adapter.onChatMessage((message) => {
    chatHistory = addChatHistory(chatHistory, { ...message, receivedAt: Date.now() });
    if (panelOpen && activityRenderTimer === null) {
      activityRenderTimer = window.setTimeout(() => {
        activityRenderTimer = null;
        render();
      }, 1000);
    }
    if (conversationUsername
      && message.username.toLocaleLowerCase("en-US") === conversationUsername.toLocaleLowerCase("en-US")
      && panelOpen) {
      render();
    }
    if (!autoCollect) return;
    const currentUsername = adapter.getCurrentUsername();
    if (currentUsername && message.username.toLocaleLowerCase("en-US") === currentUsername.toLocaleLowerCase("en-US")) {
      greetingWindowUntil = Date.now() + 5 * 60 * 1000;
      return;
    }
    if (isKnownBot(message.username)) return;
    const reason = classifyCandidate(
      message.text,
      message.replyContext,
      currentUsername,
      Date.now() <= greetingWindowUntil
    );
    if (!reason) return;
    if (moduleSettings.mentionHistory && (reason === "mention" || reason === "reply")) {
      const channel = adapter.getChannelName();
      if (channel) {
        mentionHistory = addMentionHistoryEntry(mentionHistory, {
          username: message.username,
          text: message.text.slice(0, 180),
          reason,
          channel,
          receivedAt: Date.now()
        });
        persistMentionHistory();
      }
    }
    inbox = addInboxEntry(inbox, {
      username: message.username,
      text: message.text.slice(0, 180),
      reason,
      receivedAt: Date.now()
    });
    if (!panelOpen) unreadInboxCount += 1;
    const key = message.username.toLocaleLowerCase("en-US");
    if (!selected.has(key)) {
      selected.set(key, { username: message.username, reason });
    }
    mount();
    render();
  });
  const observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
  mount();
  render();
  void browser.storage.local.get([TEMPLATE_LIBRARY_KEY, ACTIVE_TEMPLATE_KEY, LEGACY_TEMPLATE_KEY, USER_NOTES_KEY, MENTION_HISTORY_KEY, MODULE_SETTINGS_KEY]).then((stored) => {
    templates = sanitizeTemplateLibrary(stored[TEMPLATE_LIBRARY_KEY]);
    const legacy = stored[LEGACY_TEMPLATE_KEY];
    if (!Array.isArray(stored[TEMPLATE_LIBRARY_KEY]) && typeof legacy === "string" && legacy.trim()) {
      templates[0] = { ...templates[0]!, text: legacy.trim() };
    }
    const requestedId = stored[ACTIVE_TEMPLATE_KEY];
    const active = templates.find((item) => item.id === requestedId) ?? templates[0]!;
    activeTemplateId = active.id;
    templateName = active.name;
    replyTemplate = active.text;
    notes = sanitizeUserNotes(stored[USER_NOTES_KEY]);
    mentionHistory = sanitizeMentionHistory(stored[MENTION_HISTORY_KEY]);
    moduleSettings = sanitizeModuleSettings(stored[MODULE_SETTINGS_KEY]);
    persistNotes();
    persistMentionHistory();
    render();
  });
  const handleStorageChange = (
    changes: Record<string, { newValue?: unknown }>,
    areaName: string
  ) => {
    if (areaName !== "local" || !changes[MODULE_SETTINGS_KEY]) return;
    moduleSettings = sanitizeModuleSettings(changes[MODULE_SETTINGS_KEY].newValue);
    render();
  };
  browser.storage.onChanged.addListener(handleStorageChange);
  stopSettingsSync = () => browser.storage.onChanged.removeListener(handleStorageChange);
  void browser.runtime.sendMessage({ type: "pjl-get-shortcuts" }).then((result: unknown) => {
    if (!Array.isArray(result)) return;
    shortcutInfo = result.filter((item): item is ShortcutInfo => Boolean(
      item && typeof item === "object" && typeof item.name === "string" && typeof item.shortcut === "string"
    ));
    render();
  }).catch(() => undefined);

  function cleanup() {
    if (stopped) return;
    stopped = true;
    stopClicks();
    stopMessages();
    stopShortcuts();
    stopSettingsSync();
    observer.disconnect();
    if (activityRenderTimer !== null) window.clearTimeout(activityRenderTimer);
    shell.remove();
    if (document.documentElement.getAttribute(ownerAttribute) === instanceId) {
      document.documentElement.removeAttribute(ownerAttribute);
    }
  }

  return cleanup;
}

function reasonLabel(reason: CandidateReason | "manual"): string {
  switch (reason) {
    case "greeting": return "Begrüßung";
    case "mention": return "Erwähnung";
    case "reply": return "Antwort";
    case "manual": return "Manuell";
  }
}

function activityLabel(level: ActivityLevel): string {
  switch (level) {
    case "quiet": return "Ruhiger Chat";
    case "normal": return "Normaler Chat";
    case "busy": return "Aktiver Chat";
    case "rapid": return "Sehr schneller Chat";
  }
}

function remainingDays(expiresAt: number): number {
  return Math.max(1, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

function formatHistoryTime(receivedAt: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(receivedAt);
}

function shortcutSummary(info: readonly ShortcutInfo[]): string {
  if (info.length === 0) return "Firefox-Kürzel werden nach dem Neuladen angezeigt.";
  const key = (name: ShortcutInfo["name"]) =>
    info.find((item) => item.name === name)?.shortcut || "nicht belegt";
  return `Kürzel: Fenster: ${key("toggle-panel")} · Auswahl: ${key("toggle-user-selection")} · Notiz: ${key("choose-note-user")}`;
}

function conversationRelationLabel(relation: ConversationRelation): string {
  switch (relation) {
    case "message": return "Nachricht";
    case "mentions-you": return "Erwähnt dich";
    case "replies-to-you": return "Antwort an dich";
    case "your-mention": return "Deine Erwähnung";
    case "your-reply": return "Deine Antwort";
  }
}

function formatMessageTime(receivedAt: number): string {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(receivedAt);
}
