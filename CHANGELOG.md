# Changelog

## 0.1.0-alpha.5 — in development

- adapt chat activity to quiet, normal and fast chats using 5, 2 or 1 minute windows
- keep up to 1,000 messages in memory for session search and conversations
- show how long ago the latest observed chat message arrived
- periodically reconcile visible Twitch chat lines when DOM mutations are missed
- use Twitch and 7TV message timestamps for activity instead of discovery time
- add an opt-in, local and bounded technical debug log to the settings page
- open settings from the browser toolbar even when the Twitch panel cannot start
- recognize additional current Twitch chat markup and fall back from username elements to their message row
- include privacy-safe selector hit counts in the debug health check
- serialize debug-log writes so simultaneous startup events are not lost
- make the toolbar button open the PJL panel on Twitch instead of unexpectedly redirecting to settings
- document Firefox's site-permission behavior for repeatedly loaded temporary builds

## 0.1.0-alpha.4 — 2026-09-05

- process delayed text updates inside Twitch and 7TV chat messages
- keep Firefox-only manifest metadata out of the Chrome package
- make dependency build-script decisions reproducible
- keep testing documentation independent of an outdated package filename

## 0.1.0-alpha.3 — 2026-09-04

- keep tracking messages when Twitch or 7TV recycle chat DOM elements
- recognize full usernames, @mentions and clear username parts such as PJL/Lauch
- show selected users, formatted reply preview and the insert action together
- hide composer undo once the draft changes or the message is sent
- restore session search and activity tracking after long-running chat sessions

## 0.1.0-alpha.2 — 2026-09-04

- dedicated Firefox-compatible options page for module settings

## 0.1.0-alpha.1 — 2026-09-04

- Firefox-first Manifest V3 foundation
- multi-user selection and combined mention preparation
- automatic greeting, mention and reply inbox
- editable reply templates and safe composer undo
- session search, filters, conversation view and reply-later queue
- expiring local notes and bounded mention history
- chat-activity indicator and optional modules
- Firefox keyboard shortcuts with conflict visibility
- validated local data import, export and deletion
- compatibility selectors for native Twitch, 7TV and FrankerFaceZ
