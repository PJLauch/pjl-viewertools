import type { ChatAdapter, ChatMessage } from "./chat-adapter";
import { normalizeUsername } from "../core/mentions";
import { appendToDraft, canUndoDraft } from "../core/composer-draft";
import type { ComposerChange } from "../core/composer-draft";

const USERNAME_SELECTOR = [
  '[data-a-target="chat-message-username"]',
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
  '.chat-line__message[data-user]',
  'seventv-message'
].join(",");

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
    const processed = new WeakSet<Element>();
    const process = (element: Element) => {
      const line = element.matches(MESSAGE_SELECTOR) ? element : element.closest(MESSAGE_SELECTOR);
      if (!line || processed.has(line)) return;
      processed.add(line);
      const usernameElement = line.querySelector<HTMLElement>(USERNAME_SELECTOR);
      const username = usernameElement ? usernameFromElement(usernameElement) : null;
      if (!username) return;
      const messageElement = line.querySelector<HTMLElement>('[data-a-target="chat-message-text"]');
      const replyElement = line.querySelector<HTMLElement>('[data-a-target="chat-message-reply-context"]');
      listener({
        username,
        text: (messageElement?.textContent ?? line.textContent ?? "").trim(),
        replyContext: (replyElement?.textContent ?? "").trim()
      });
    };
    this.root.querySelectorAll(MESSAGE_SELECTOR).forEach(process);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          process(node);
          node.querySelectorAll(MESSAGE_SELECTOR).forEach(process);
        }
      }
    });
    observer.observe(this.root.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
