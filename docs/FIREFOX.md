# Firefox development and release

Firefox is the primary target. The extension uses Manifest V3 and currently
requires Firefox 140 or newer. It declares `data_collection_permissions` as
`none`: no chat content, browsing activity, usage data, or technical data is
transmitted outside the browser.

## Local test

1. Run `pnpm install` and `pnpm build`.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Choose **Load Temporary Add-on**.
4. Select `.output/firefox-mv3/manifest.json`.
5. Open a Twitch channel and its chat.
6. Select **Nutzer auswählen**, click several chat names, and choose
   **Mentions vorbereiten**.
7. Confirm that text appears in the composer but is not sent.

Temporary add-ons disappear when Firefox closes. A permanent public install
requires Mozilla Add-ons signing. Before the first submission, replace the
placeholder Gecko id in `wxt.config.ts` with the final stable add-on id and
complete the compatibility checklist below.

## Compatibility checklist

- Firefox current stable, private window behavior documented
- vanilla Twitch chat
- Twitch with 7TV
- Twitch with FrankerFaceZ
- Twitch with 7TV and FrankerFaceZ together
- channel navigation without full page reload
- pop-out chat and theater mode
- light and dark Twitch themes
- keyboard-only operation and German/English browser locales
- existing composer draft is preserved
- no click or code path sends a message
