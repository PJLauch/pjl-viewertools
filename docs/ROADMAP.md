# Feature roadmap

## 0.1 — Multi-mention MVP

- select/deselect chat users by clicking their names
- collect direct mentions and replies automatically
- collect general greetings for five minutes after the user's own message
- exclude known service bots from automatic candidates
- visible selection tray with remove and clear actions
- prepare a deduplicated mention line in Twitch's composer
- preserve the user's existing draft and never auto-send
- resilient SPA remount and basic accessibility
- Chrome and Firefox builds; manual 7TV/FFZ compatibility pass

Exit: no duplicate mentions, keyboard-accessible tray, and no send event in the
codebase.

## 0.2 — Reply workflow

- editable local template library with starter suggestions (implemented)
- Firefox/browser keyboard shortcuts (implemented); selection from message action menu later
- undo after composer insertion (implemented)
- per-module toggles in the chat panel (implemented); dedicated options page later

## 0.3 — Context

- bounded session inbox with unread counter (implemented)
- bounded persistent mention history (implemented)
- session conversation view with a user's last messages (implemented)
- connect reply and explicit-mention threads in conversation view (implemented)
- local session chat search by message or @username (implemented)
- non-destructive live chat filters for text, users and direct mentions (implemented)
- session-only "reply later" queue (implemented)

## 0.4 — Awareness

- rolling activity indicator and active-chatters summary (implemented)
- temporary per-user notes with expiry (implemented)
- privacy dashboard, validated JSON import/export and clear-data controls (implemented)

## Later candidates

- saved reply snippets, raid/welcome helpers, nickname aliases and accessibility
  improvements. No impersonation, automated sending,
  bulk messaging, viewer-list scraping or moderation evasion.
