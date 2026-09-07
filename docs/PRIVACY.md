# Privacy

PJL ViewerTools is local-first. It has no analytics, telemetry, advertising,
account system or remote backend. It does not transmit chat content or usage
data to the project maintainers.

## Session-only data

The following data remains in memory and disappears when the Twitch page is
closed or reloaded:

- the last 1,000 observed chat messages used for search, filters and conversations
- the current username selection
- the inbox and unread count
- the reply-later queue
- chat-activity calculations

## Persistent local data

Firefox extension storage contains only:

- reply templates and the active template
- enabled module settings
- private user notes, each with an expiry of 1, 7 or 30 days
- up to 100 direct mentions or replies, retained for at most 30 days
- when explicitly enabled, up to 100 technical debug entries without chat text or usernames

The settings panel shows stored item counts. Users can export a validated JSON
backup or remove all persistent PJL data. Import replaces existing persistent
data only after confirmation.

Debug logging is disabled by default. It can be copied or deleted from the
settings page and is never transmitted automatically.

## Twitch composer

PJL ViewerTools can insert prepared text into Twitch's existing chat composer.
It does not click or invoke Twitch's send action. Undo restores the prior draft
only while the inserted text has not been changed by the user.

## Permissions

- `https://www.twitch.tv/*`: observe supported chat elements and show the PJL UI
- `storage`: keep the persistent local data listed above

No broader browsing-history, downloads, identity or network permission is
requested.
