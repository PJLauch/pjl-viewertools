import { browser } from "wxt/browser";
import { isShortcutCommand, isShortcutControlMessage } from "../src/core/shortcut-command";

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (!isShortcutCommand(command)) return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://www.twitch.tv/")) return;
    await browser.tabs.sendMessage(tab.id, { type: "pjl-shortcut", command }).catch(() => undefined);
  });
  browser.runtime.onMessage.addListener((message) => {
    if (!isShortcutControlMessage(message)) return undefined;
    if (message.type === "pjl-get-shortcuts") {
      return browser.commands.getAll().then((commands) => commands
        .filter((command) => isShortcutCommand(command.name))
        .map((command) => ({ name: command.name, shortcut: command.shortcut ?? "" })));
    }
    const firefoxCommands = browser.commands as typeof browser.commands & {
      openShortcutSettings?: () => Promise<void>;
    };
    if (firefoxCommands.openShortcutSettings) {
      return firefoxCommands.openShortcutSettings().then(() => true);
    }
    return browser.tabs.create({ url: "chrome://extensions/shortcuts" }).then(() => true);
  });
});
