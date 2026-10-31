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
- Dienstplan mit Wochenwechsel, Gruppenfilter, manueller Bearbeitung, Ziehen des Dienstendes in 15-Minuten-Schritten und PDF-Druckansicht mit vertikalen Zeitbox-Beschriftungen
- automatische Vorbelegung als bearbeitbarer Entwurf
- Mitarbeitenden-Stammdaten und feste Dienstsperren
- Abwesenheiten und Urlaubskonto (vereinfachte Werktagszählung)
- Sondertermine mit Kategorien und Teilnehmendenauswahl
- Auswertungen aus den vorhandenen Diensteinträgen
- Leitungsprofil mit Gruppen- und Bürozeit

## Fachliche Grenzen – vor produktivem Einsatz klären

- Die automatische Vorbelegung verteilt die hinterlegten Wochenstunden in 15-Minuten-Schritten auf verfügbare Werktage. Die Zuweisung ist heuristisch und garantiert keine optimale oder vollständige Lösung. Nicht verteilte Stunden werden ausgewiesen.
- Mindestbesetzung wird in 15-Minuten-Intervallen geprüft. Unterbesetzungen werden in der Planprüfung angezeigt; die Vorbelegung garantiert keine vollständige Erfüllung aller Besetzungsziele.
- Die App prüft eine vereinfachte Pausenlogik, tägliche Höchstarbeitszeit und elf Stunden Ruhezeit. Das ersetzt keine vollständige arbeitsrechtliche Prüfung und berücksichtigt nicht alle Tarif-, Teilzeit- oder betrieblichen Sonderregeln.
- Bürozeiten der Leitung werden nicht als feste Zeitblöcke geplant; nur die Gruppenzeit kann als Besetzung erscheinen.
- Genehmigte bzw. erfasste Abwesenheiten und feste Dienstsperren blockieren neue automatische und manuelle Dienste. Bereits vorhandene Dienste werden nicht automatisch gelöscht; die Planprüfung weist Konflikte aus.
- Urlaub wird aktuell als Montag-bis-Freitag-Zählung berechnet. Feiertage und betriebliche Schließtage werden nicht abgezogen.
- Die Monatskalenderansicht, Druckausgabe und Darstellung auf realen Mobilgeräten sind noch nicht durch einen echten Browser-/iPhone-End-to-End-Test abgenommen.
- Die Speicherung erfolgt als gemeinsamer JSON-Datensatz. Eine optimistische Versionsprüfung erkennt konkurrierende Änderungen und verhindert das unbemerkte Überschreiben eines neueren Datenstands. Eine automatische Zusammenführung paralleler Änderungen gibt es nicht.
- Es gibt derzeit keine nachgewiesene automatisierte Datenbanksicherung oder vollständige Prüfung der RLS-Policies.

## Testdaten und Datenschutz

Die Anwendung startet mit elf Beispieldatensätzen, sofern kein gespeicherter Supabase-Zustand geladen wird. Vor echtem Personaleinsatz müssen Beispieldaten entfernt und Datenschutz, Zugriffsrechte, Aufbewahrung, Backups und fachliche Regeln geklärt werden.

## Veröffentlichung

GitHub Pages kann die statischen Dateien aus dem Hauptbranch veröffentlichen. Nach Änderungen an JavaScript oder CSS müssen die Versionsparameter in `index.html` aktualisiert werden, damit Browser die neuen Dateien laden.
