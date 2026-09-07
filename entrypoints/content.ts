import "../src/ui/styles.css";
import { TwitchDomAdapter } from "../src/platform/twitch-dom-adapter";
import { mountUserSelection } from "../src/features/user-selection";
import { appendDebugLog } from "../src/core/debug-log";

export default defineContentScript({
  matches: ["https://www.twitch.tv/*"],
  runAt: "document_idle",
  main() {
    void appendDebugLog("content", "starting", {
      browser: import.meta.env.BROWSER,
      documentReadyState: document.readyState
    });
    try {
      const stop = mountUserSelection(new TwitchDomAdapter(document));
      void appendDebugLog("content", "mounted");
      window.setTimeout(() => {
        void appendDebugLog("content", "health-check", {
          panelConnected: Boolean(document.querySelector('[data-tpt-root="selection"]')),
          chatInputFound: Boolean(document.querySelector('[data-a-target="chat-input"], [role="textbox"][contenteditable="true"]')),
          chatSettingsFound: Boolean(document.querySelector('[data-a-target="chat-settings"]')),
          nativeLines: document.querySelectorAll('[data-a-target="chat-line-message"]').length,
          testLines: document.querySelectorAll('[data-test-selector="chat-line-message"]').length,
          legacyLines: document.querySelectorAll('.chat-line__message').length,
          sevenTvLines: document.querySelectorAll('seventv-message').length,
          nativeUsernames: document.querySelectorAll('[data-a-target="chat-message-username"]').length,
          testUsernames: document.querySelectorAll('[data-test-selector*="username"]').length,
          dataUsers: document.querySelectorAll('[data-a-user], [data-user]').length,
          messageTexts: document.querySelectorAll('[data-a-target="chat-message-text"], [data-test-selector="chat-message-text"], .text-fragment').length
        });
      }, 3_000);
      window.addEventListener("pagehide", () => {
        void appendDebugLog("content", "pagehide");
        stop();
      }, { once: true });
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      console.error("PJL ViewerTools failed to start", failure);
      void appendDebugLog("content", "mount-failed", {
        errorName: failure.name,
        errorMessage: failure.message,
        errorStack: failure.stack ?? ""
      });
    }
  }
});
