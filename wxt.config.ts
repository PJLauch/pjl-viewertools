import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "PJL ViewerTools",
    description: "Local-first chat assistance for Twitch viewers.",
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      96: "icon/96.png",
      128: "icon/128.png"
    },
    permissions: ["storage"],
    host_permissions: ["https://www.twitch.tv/*"],
    commands: {
      "toggle-panel": {
        suggested_key: { default: "Ctrl+Alt+P" },
        description: "PJL ViewerTools öffnen oder schließen"
      },
      "toggle-user-selection": {
        suggested_key: { default: "Ctrl+Alt+A" },
        description: "Nutzerauswahl starten oder beenden"
      },
      "choose-note-user": {
        suggested_key: { default: "Ctrl+Alt+N" },
        description: "Nutzer für eine private Notiz wählen"
      }
    },
    browser_specific_settings: {
      gecko: {
        id: "pjl-viewertools@example.invalid",
        strict_min_version: "140.0",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    }
  }
});
