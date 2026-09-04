# Architecture

## Decision summary

Use a Firefox-first Manifest V3 WebExtension built with TypeScript and WXT. One content
script owns a small feature registry. Features depend only on stable internal
ports (`ChatAdapter`, settings, storage), not on Twitch or another extension's
private runtime objects.

## Layers

1. **Platform adapter** finds chat messages, usernames, and Twitch's editable
   composer through accessible roles and `data-a-target` fallbacks.
2. **Core** provides feature lifecycle, typed events and bounded local state.
3. **Feature modules** add selection, history, search, activity, notes, etc.
4. **UI shell** mounts one namespaced root next to chat and renders feature UI.

The MVP runs entirely in the isolated content-script world and needs no page
script or background worker. This reduces collision and security risk. A page
bridge may be added only if a feature cannot be implemented through the DOM,
with a narrow, versioned `postMessage` contract.

Firefox is the default development, build, and packaging target. Chromium is a
secondary compatibility target generated from the same source. The Firefox
manifest declares no data collection and starts at Firefox 140, where Mozilla's
built-in data-consent declaration is supported.

## Twitch and extension coexistence

- Never replace chat messages or the composer.
- Attach one click listener by event delegation; do not add controls to every
  message.
- Ignore clicks inside the extension's own `data-tpt-root`.
- Store only normalized usernames; never scrape private account data.
- Reconnect using a bounded `MutationObserver` because Twitch navigation is an
  SPA and chat containers are replaced.
- Keep selectors centralized and covered by fixture tests.
- Prefix CSS classes, custom properties and DOM attributes with `tpt`.

## Data and privacy

Selection, session inbox and full chat history are memory-only and disappear on
reload. Reply templates, expiring notes and a bounded direct-mention history use
`browser.storage.local`. Mention history keeps at most 100 entries for 30 days and
has its own clear control. No telemetry or remote service is planned. Notes stay
local and should not contain sensitive information.

## Module contract

Each feature exports a stable id and `mount(context)`, returning a cleanup
function. A failure is isolated so Twitch chat and other modules keep working.
Feature settings will use versioned schemas and migrations.

## Testing strategy

- unit tests for mention composition, deduplication and limits
- adapter tests against sanitized Twitch DOM fixtures
- browser smoke tests with mocked chat DOM
- manual compatibility matrix: Chrome/Firefox × vanilla/7TV/FFZ/both

No automatic send action is exposed by the architecture.
