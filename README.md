# Früh bis spät – Der Kita-Dienstplaner

Browserbasierte Kita-Dienstplanung mit Supabase-Anmeldung und Speicherung eines gemeinsamen App-Zustands.

## Dateien

- `index.html` – App-Grundgerüst und externe Supabase-JS-Bibliothek
- `styles.css` – Gestaltung und responsive Darstellung
- `app.js` – Navigation, Planung, Personal, Abwesenheiten, Termine, Auswertungen und Datenbankzugriffe

## Technischer Betrieb

Die Anwendung benötigt:
- GitHub Pages oder einen anderen statischen Webserver
- eine erreichbare Supabase-Instanz
- die Supabase-JS-Bibliothek von jsDelivr
- die Tabellen `app_owner` und `app_state`

Der Anwendungscode verwendet die Tabellen `app_owner` (freigeschaltete Leitungszugänge) und `app_state` (gemeinsamer JSON-Zustand mit ID 1). Die tatsächliche Tabellenstruktur, Row-Level-Security-Policies, Backup-Strategie und Berechtigungen müssen im Supabase-Projekt separat geprüft werden. Der veröffentlichte JavaScript-Code allein beweist nicht, dass die Datenbank korrekt abgesichert ist.

## Funktionen

- Dashboard und Wochenübersicht
- Dienstplan mit Wochenwechsel, Gruppenfilter, manuellem Bearbeiten und PDF-Druckansicht
- automatische Vorbelegung als bearbeitbarer Entwurf
- Mitarbeitenden-Stammdaten und feste Dienstsperren
- Abwesenheiten und Urlaubskonto (vereinfachte Werktagszählung)
- Sondertermine mit Kategorien und Teilnehmendenauswahl
- Auswertungen aus den vorhandenen Diensteinträgen
- Leitungsprofil mit Gruppen- und Bürozeit

## Fachliche Grenzen – vor produktivem Einsatz klären

- Die automatische Vorbelegung ist kein Optimierungsalgorithmus. Sie verteilt Wochenstunden näherungsweise auf fünf Werktage und meldet Unterbesetzungen, statt sie zuverlässig zu lösen.
- Mindestbesetzung wird in Zeitintervallen geprüft. Die Vorbelegung garantiert weder die Mindestbesetzung noch eine vollständige Erfüllung aller individuellen Verfügbarkeiten.
- Pausen, gesetzliche Höchstarbeitszeiten, Ruhezeiten, Feiertage, Teilzeit- und Tarifregeln werden nicht vollständig geprüft.
- Bürozeiten der Leitung werden nicht als feste Zeitblöcke geplant; nur die Gruppenzeit kann als Besetzung erscheinen.
- Abwesenheiten warnen vor bereits eingetragenen Diensten. Die Dienste werden nicht automatisch gelöscht.
- Urlaub wird aktuell als Montag-bis-Freitag-Zählung berechnet. Feiertage und betriebliche Schließtage werden nicht abgezogen.
- Die Monatskalenderansicht, Druckausgabe und Darstellung auf realen Mobilgeräten müssen im Browser geprüft werden.
- Die Speicherung erfolgt als gemeinsamer JSON-Datensatz. Gleichzeitige Bearbeitung durch mehrere Leitungen kann zu konkurrierenden Änderungen führen.
- Es gibt derzeit keine nachgewiesene automatisierte Datenbanksicherung oder vollständige Prüfung der RLS-Policies.

## Testdaten und Datenschutz

Die Anwendung startet mit elf Beispieldatensätzen, sofern kein gespeicherter Supabase-Zustand geladen wird. Vor echtem Personaleinsatz müssen Beispieldaten entfernt und Datenschutz, Zugriffsrechte, Aufbewahrung, Backups und fachliche Regeln geklärt werden.

## Veröffentlichung

GitHub Pages kann die statischen Dateien aus dem Hauptbranch veröffentlichen. Nach Änderungen an JavaScript oder CSS müssen die Versionsparameter in `index.html` aktualisiert werden, damit Browser die neuen Dateien laden.
