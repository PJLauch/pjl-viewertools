import type { ChatAdapter, ChatMessage } from "./chat-adapter";
import { normalizeUsername } from "../core/mentions";
import { appendToDraft, canUndoDraft } from "../core/composer-draft";
import type { ComposerChange } from "../core/composer-draft";

const USERNAME_SELECTOR = [
  '[data-a-target="chat-message-username"]',
  '[data-test-selector="chat-message-username"]',
  '[data-test-selector="chat-line-username"]',
  '[data-test-selector="message-username"]',
  '.chat-author__display-name',
  '.chat-line__username',
  'seventv-chat-user-username',
  '.seventv-chat-user-username',
  '[data-a-user]'
].join(",");
const COMPOSER_SELECTOR = '[data-a-target="chat-input"], [role="textbox"][contenteditable="true"]';
const MESSAGE_SELECTOR = [
  '[data-a-target="chat-line-message"]',
  '[data-test-selector="chat-line-message"]',
  '.chat-line__message',
  '.chat-line__message[data-user]',
  'seventv-message'
].join(",");
const MESSAGE_TEXT_SELECTOR = [
  '[data-a-target="chat-message-text"]',
  '[data-test-selector="chat-message-text"]',
  '.text-fragment',
  '.seventv-chat-message-body',
  '.seventv-message-content'
].join(",");
const TIMESTAMP_SELECTOR = [
  '[data-a-target="chat-timestamp"]',
  '.seventv-chat-message-timestamp',
  'time[datetime]'
].join(",");

export function parseChatTimestamp(value: string, now = Date.now()): number | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  const absolute = Date.parse(normalized);
  if (Number.isFinite(absolute) && /\d{4}/.test(normalized)) return absolute;

  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minutes > 59 || hours > (meridiem ? 12 : 23) || hours < 0) return null;
  if (meridiem === "AM") hours = hours === 12 ? 0 : hours;
  if (meridiem === "PM") hours = hours === 12 ? 12 : hours + 12;

  const timestamp = new Date(now);
  timestamp.setHours(hours, minutes, 0, 0);
  if (timestamp.getTime() > now + 5 * 60_000) timestamp.setDate(timestamp.getDate() - 1);
  return timestamp.getTime();
}

function usernameFromElement(element: HTMLElement): string | null {
  const explicit = element.dataset.aUser
    ?? element.closest<HTMLElement>("[data-user]")?.dataset.user
    ?? element.querySelector<HTMLElement>("[data-a-user]")?.dataset.aUser;
  if (explicit) return normalizeUsername(explicit);

  const link = element.closest<HTMLAnchorElement>('a[href^="/"]');
  const pathUsername = link?.getAttribute("href")?.match(/^\/([a-zA-Z0-9_]{1,25})(?:\/|$)/)?.[1];
  return normalizeUsername(pathUsername ?? element.textContent ?? "");
}

export class TwitchDomAdapter implements ChatAdapter {
  constructor(private readonly root: Document) {}

  onUsernameClick(listener: (username: string) => boolean): () => void {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.target.closest("[data-tpt-root]")) return;
      const element = event.target.closest<HTMLElement>(USERNAME_SELECTOR);
      if (!element) return;
      const username = usernameFromElement(element);
      if (username && listener(username)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.root.addEventListener("click", handleClick, true);
    return () => this.root.removeEventListener("click", handleClick, true);
  }

  onChatMessage(listener: (message: ChatMessage) => void): () => void {
    const processed = new WeakMap<Element, string>();
    const processLine = (line: Element) => {
      const usernameElement = line.querySelector<HTMLElement>(USERNAME_SELECTOR);
      const username = usernameElement ? usernameFromElement(usernameElement) : null;
      if (!username || !usernameElement) return;
      const messageElements = Array.from(line.querySelectorAll<HTMLElement>(MESSAGE_TEXT_SELECTOR));
      const messageElement = messageElements[0] ?? null;
      const replyElement = line.querySelector<HTMLElement>('[data-a-target="chat-message-reply-context"]');
      const timestampElement = line.querySelector<HTMLElement>(TIMESTAMP_SELECTOR);
      const text = (messageElements.length > 1
        ? messageElements.map((item) => item.textContent ?? "").join("")
        : messageElement?.textContent ?? line.textContent ?? "").trim();
      if (!text || (!messageElement && text === usernameElement.textContent?.trim())) return;
      const replyContext = (replyElement?.textContent ?? "").trim();
      const fingerprint = `${username}\n${text}\n${replyContext}`;
      if (processed.get(line) === fingerprint) return;
      processed.set(line, fingerprint);
      listener({
        username,
        text,
        replyContext,
        receivedAt: parseChatTimestamp(
          timestampElement?.getAttribute("datetime") ?? timestampElement?.textContent ?? ""
        ) ?? undefined
      });
    };
    const process = (element: Element) => {
      const line = element.matches(MESSAGE_SELECTOR) ? element : element.closest(MESSAGE_SELECTOR);
      if (line) processLine(line);
    };
    const processFromUsername = (usernameElement: Element) => {
      let candidate = usernameElement.parentElement;
      for (let depth = 0; candidate && depth < 8; depth += 1, candidate = candidate.parentElement) {
        if (candidate.querySelector(MESSAGE_TEXT_SELECTOR)
          && candidate.querySelectorAll(USERNAME_SELECTOR).length <= 3) {
          processLine(candidate);
          return;
        }
      }
    };
    const scanVisibleMessages = () => {
      this.root.querySelectorAll(MESSAGE_SELECTOR).forEach(process);
      this.root.querySelectorAll(USERNAME_SELECTOR).forEach(processFromUsername);
    };
    scanVisibleMessages();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" || record.type === "attributes") {
          const parent = record.target.parentElement;
          if (record.target instanceof Element) process(record.target);
          else if (parent) process(parent);
          continue;
        }
        for (const node of record.addedNodes) {
          if (node instanceof DocumentFragment) {
            node.querySelectorAll(MESSAGE_SELECTOR).forEach(process);
            continue;
          }
          const element = node instanceof Element ? node : node.parentElement;
          if (element) {
            process(element);
            element.querySelectorAll(MESSAGE_SELECTOR).forEach(process);
          }
        }
      }
    });
    observer.observe(this.root.body, {
      attributes: true,
      attributeFilter: ["data-user", "data-a-user"],
      characterData: true,
      childList: true,
      subtree: true
    });
    const reconciliationTimer = this.root.defaultView?.setInterval(scanVisibleMessages, 2_000);
    return () => {
      observer.disconnect();
      if (reconciliationTimer !== undefined) this.root.defaultView?.clearInterval(reconciliationTimer);
    };
  }

  writeComposer(text: string): ComposerChange | null {
    const composer = this.root.querySelector<HTMLElement>(COMPOSER_SELECTOR);
    if (!composer) return null;
    const change = appendToDraft(composer.textContent ?? "", text);
    if (!change) return null;
    this.replaceComposerText(composer, change.insertedText);
    return change;
  }

  undoComposer(change: ComposerChange): boolean {
    const composer = this.root.querySelector<HTMLElement>(COMPOSER_SELECTOR);
    if (!composer || !canUndoDraft(composer.textContent ?? "", change)) return false;
    this.replaceComposerText(composer, change.previousText);
    return true;
  }

  canUndoComposer(change: ComposerChange): boolean {
    const composer = this.root.querySelector<HTMLElement>(COMPOSER_SELECTOR);
    return Boolean(composer && canUndoDraft(composer.textContent ?? "", change));
  }

  getMountPoint(): HTMLElement | null {
    const chatSettings = this.root.querySelector<HTMLElement>('[data-a-target="chat-settings"]');
    if (chatSettings?.parentElement) return chatSettings.parentElement;
    const composer = this.root.querySelector<HTMLElement>(COMPOSER_SELECTOR);
    if (!composer) return null;
    const form = composer.closest<HTMLElement>("form");
    return form?.parentElement ?? composer.parentElement?.parentElement ?? null;
  }

  getCurrentUsername(): string | null {
    const avatar = this.root.querySelector<HTMLImageElement>('[data-a-target="user-menu-toggle"] img[alt]');
    const displayName = this.root.querySelector<HTMLElement>('[data-a-target="user-display-name"]');
    return normalizeUsername(avatar?.alt ?? displayName?.textContent ?? "");
  }

  getChannelName(): string | null {
    const channel = this.root.location.pathname.split("/").filter(Boolean)[0] ?? "";
    return normalizeUsername(channel);
  }

  private replaceComposerText(composer: HTMLElement, text: string): void {
    composer.focus();
    this.root.execCommand("selectAll", false);
    const inserted = this.root.execCommand("insertText", false, text);
    if (!inserted) {
      composer.textContent = text;
      composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    }
  }
}
