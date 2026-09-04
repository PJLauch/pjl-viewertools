# PJL ViewerTools in Firefox testen

Diese Vorabversion ist noch nicht von Mozilla signiert. Sie kann deshalb als
temporäres Add-on getestet werden und wird beim Beenden von Firefox wieder
entfernt.

## Installation

1. In Firefox `about:debugging#/runtime/this-firefox` öffnen.
2. Auf **Temporäres Add-on laden…** klicken.
3. Die zugesandte Datei `pjl-viewertools-0.1.0-alpha.1-firefox.zip` auswählen.
4. Einen Twitch-Kanal öffnen oder die bereits geöffnete Twitch-Seite neu laden.

Unten am Twitch-Chat sollte nun die Schaltfläche **PJL** erscheinen.

## Kurzer Funktionstest

1. **Nutzer auswählen** aktivieren und zwei Namen im Chat anklicken.
2. **Mentions vorbereiten** wählen und prüfen, dass nur Text eingefügt, aber
   nichts gesendet wird.
3. Das Einfügen über **Rückgängig** wieder entfernen.
4. Eine eigene Vorlage speichern.
5. Suche, Filter und Unterhaltung für einige neue Chatnachrichten ausprobieren.
6. Eine Notiz über **Nutzer im Chat wählen** anlegen.
7. Twitch mit 7TV und/oder FrankerFaceZ testen, falls vorhanden.

## Wichtige Hinweise

- PJL ViewerTools sendet niemals automatisch eine Chatnachricht.
- Vorlagen, Notizen und der Mention-Verlauf werden nur lokal in Firefox gespeichert.
- Die Erweiterung benötigt Zugriff auf `https://www.twitch.tv/*` und lokalen
  Erweiterungsspeicher.
- Nach einem Firefox-Neustart muss die Erweiterung über `about:debugging` erneut
  geladen werden.

## Rückmeldung

Für einen Fehlerbericht bitte notieren:

- Firefox-Version
- ob 7TV und/oder FrankerFaceZ aktiv sind
- welche Funktion benutzt wurde
- was erwartet wurde und was stattdessen passiert ist
- nach Möglichkeit einen Screenshot ohne private Inhalte
