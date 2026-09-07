# PJL ViewerTools

PJL ViewerTools is an open-source, Firefox-first assistant for people who actively
participate in Twitch chats. It complements 7TV, FrankerFaceZ and BetterTTV
instead of replacing their emote features.

The extension prepares text in Twitch's composer but **never sends a message**.

## Current features

- select multiple chat users and prepare one combined `@mention` reply
- collect greetings, direct mentions and replies into a session inbox
- editable reply-template library with user-created templates
- safe undo that restores the previous Twitch draft
- session-only reply-later queue
- searchable session chat and non-destructive live filters
- conversation view with reply and mention relationships
- bounded local mention history: 100 entries, removed after 30 days
- expiring private user notes for 1, 7 or 30 days
- adaptive chat-activity indicator using a 1, 2 or 5 minute window
- session-only search across the latest 1,000 observed messages
- optional modules and Firefox keyboard shortcuts
- dedicated settings page, opened from the PJL menu, with live module synchronization
- validated local JSON backup and restore

## Privacy and permissions

PJL ViewerTools has no account, analytics, telemetry, advertising or remote
backend. It requests only access to Twitch pages for its chat interface and
extension storage for templates, settings, notes and mention history.

The full chat history, inbox, selection and reply-later queue exist only for the
current page session. See [Privacy](docs/PRIVACY.md) for retention details.

## Try the Firefox development build

Firefox needs permission to read Twitch so the chat tools can start automatically. A normal signed installation asks for this during installation. When repeatedly removing and loading temporary test builds, Firefox may forget the permission; in the extension menu choose **Always allow on www.twitch.tv** again.

1. Build or obtain the current Firefox ZIP from a PJL ViewerTools release.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Choose **Load Temporary Add-on** and select the ZIP.
4. Open or reload a Twitch channel.
5. Use the **PJL** button at the bottom of chat.

Temporary add-ons disappear after Firefox restarts. A permanent installation
requires Mozilla signing. See [Firefox testing](TESTING-FIREFOX.md).

## Development

Requirements: a current Node.js release and pnpm.

```sh
pnpm install
pnpm check
pnpm build:firefox
pnpm build:chrome
```

The default build target is Firefox Manifest V3. Build output is written to
`.output/`. The project uses TypeScript, WXT and Vitest.

## Project principles

- local-first and least privilege
- user remains in control: prepare, never send
- clean implementation instead of copying public source code
- isolated UI that coexists with Twitch, 7TV and FrankerFaceZ
- bounded storage and visible deletion controls
- Firefox first, Chromium from the same codebase
- no AI-generated image assets; branding is manually constructed and reproducible

See [Architecture](docs/ARCHITECTURE.md), [Roadmap](docs/ROADMAP.md),
[Licensing](docs/LICENSING.md), [Contributing](CONTRIBUTING.md) and
[Security](SECURITY.md). Artwork rules and sources are documented under
[Branding](docs/BRANDING.md).

## Status

PJL ViewerTools is alpha software. Twitch changes its interface frequently, so
live compatibility reports—especially with 7TV and FrankerFaceZ—are welcome.

## License

MIT. The implementation is original work; researched projects and provenance
rules are listed in [NOTICE.md](NOTICE.md). Twitch is a trademark of Twitch
Interactive, Inc. PJL ViewerTools is not affiliated with or endorsed by Twitch,
7TV, FrankerFaceZ, BetterTTV or Chatterino.
