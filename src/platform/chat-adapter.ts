import type { ComposerChange } from "../core/composer-draft";

export interface ChatAdapter {
  onUsernameClick(listener: (username: string) => boolean): () => void;
  onChatMessage(listener: (message: ChatMessage) => void): () => void;
  writeComposer(text: string): ComposerChange | null;
  undoComposer(change: ComposerChange): boolean;
  canUndoComposer(change: ComposerChange): boolean;
  getMountPoint(): HTMLElement | null;
  getCurrentUsername(): string | null;
  getChannelName(): string | null;
}

export interface ChatMessage {
  username: string;
  text: string;
  replyContext: string;
}
