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
- Dienstplan mit Wochenwechsel, Gruppenfilter, manueller Bearbeitung, Ziehen beider Dienstgrenzen in 15-Minuten-Schritten und PDF-Druckansicht mit vertikalen Zeitbox-Beschriftungen; große Teams werden automatisch auf mehrere A4-Seiten verteilt
- automatische Vorbelegung als bearbeitbarer Entwurf
- Mitarbeitenden-Stammdaten mit individuell konfigurierbaren regulären Arbeitstagen sowie feste Dienstsperren
- Abwesenheiten und Urlaubskonto (vereinfachte Werktagszählung)
- Sondertermine mit Kategorien und Teilnehmendenauswahl
- Auswertungen aus den vorhandenen Diensteinträgen
- Leitungsprofil mit Gruppen- und Bürozeit

## Fachliche Grenzen – vor produktivem Einsatz klären

- Die automatische Vorbelegung verteilt Wochenstunden dynamisch auf die verbleibenden verfügbaren Werktage. Die Zuweisung ist weiterhin heuristisch und garantiert keine optimale oder vollständige Lösung. Nicht verteilte sowie über dem Soll liegende Stunden und Unterbesetzungen werden in der Vorprüfung ausgewiesen.
- Mindestbesetzung wird in 15-Minuten-Intervallen geprüft. Sonderdienste wie Meetings, Supervision und Fortbildungen zählen nicht als Gruppenbesetzung. Unterbesetzungen werden in der Planprüfung angezeigt; die Vorbelegung garantiert keine vollständige Erfüllung aller Besetzungsziele.
- Die Planungsprüfung testet mehrere Gruppen, Teilzeit-Arbeitstage, Termine, Abwesenheiten, Dienstsperren und manuelle Sonderdienste gemeinsam. Die automatische Verteilung bleibt heuristisch; bei nicht unterzubringenden Stunden wird erst nach Prüfung aller verfügbaren Wochentage gewarnt.
- Die App berücksichtigt bei Diensten eine 30-minütige Pause bei mehr als sechs Stunden sowie 45 Minuten bei mehr als neun Stunden Nettoarbeitszeit, tägliche Höchstarbeitszeit und elf Stunden Ruhezeit. Das ersetzt keine vollständige arbeitsrechtliche Prüfung und berücksichtigt nicht alle Tarif-, Teilzeit- oder betrieblichen Sonderregeln.
- Bürozeiten der Leitung werden nicht als feste Zeitblöcke geplant; nur die Gruppenzeit kann als Besetzung erscheinen.
- Genehmigte bzw. erfasste Abwesenheiten und feste Dienstsperren blockieren neue automatische und manuelle Dienste. Bereits vorhandene Dienste werden nicht automatisch gelöscht; die Planprüfung weist Konflikte aus.
- Urlaub wird anhand der je Person hinterlegten regulären Arbeitstage berechnet; gesetzliche NRW-Feiertage werden abgezogen. Hinterlegte betriebliche Schließzeiten werden bei der Urlaubsberechnung und automatischen Planung berücksichtigt.
- Die Monatskalendernavigation, die mehrseitige Druckausgabe und die mobile Browseransicht sind durch Playwright-Tests abgedeckt. Ein zusätzlicher Abnahmetest auf realen iPhones und Tablets steht noch aus.
- Die Speicherung erfolgt als gemeinsamer JSON-Datensatz. Eine optimistische Versionsprüfung erkennt konkurrierende Änderungen und verhindert das unbemerkte Überschreiben eines neueren Datenstands. Eine automatische Zusammenführung paralleler Änderungen gibt es nicht.
- Es gibt derzeit keine nachgewiesene automatisierte Datenbanksicherung oder vollständige Prüfung der RLS-Policies.

## Testdaten und Datenschutz

Die Anwendung startet mit elf Beispieldatensätzen, sofern kein gespeicherter Supabase-Zustand geladen wird. Vor echtem Personaleinsatz müssen Beispieldaten entfernt und Datenschutz, Zugriffsrechte, Aufbewahrung, Backups und fachliche Regeln geklärt werden.


## Mitarbeitendenzugang (erster Ausbauschritt)

Mitarbeitende können sich mit einem eigenen Supabase-Auth-Konto anmelden und sehen ausschließlich ihre eigenen Dienste. Der Zugriff ist zunächst schreibgeschützt. Der Browser erhält weder den gemeinsamen `app_state`-Datensatz noch Dienste anderer Personen.

Zur Einrichtung eines Testkontos:

1. Lege im Supabase-Dashboard unter **Authentication → Users** einen Benutzer an oder lade ihn ein.
2. Führe `supabase/employee_access.sql` einmal im SQL Editor aus.
3. Verknüpfe das Auth-Konto mit dem Mitarbeitendennamen, der im Dienstplan steht:

   ```sql
   insert into public.employee_access (user_id, person_name)
   values ('<AUTH-USER-UUID>', '<Name wie im Dienstplan>');
   ```

4. Veröffentliche `supabase/functions/employee-schedule/index.ts` als Edge Function `employee-schedule` mit aktivierter JWT-Prüfung.

Zum Entziehen des Mitarbeiterzugangs entferne den Eintrag aus `employee_access` und deaktiviere das Auth-Konto. Der Leitungsszugang bleibt über `app_owner` separat geregelt.

## Veröffentlichung

GitHub Pages kann die statischen Dateien aus dem Hauptbranch veröffentlichen. Nach Änderungen an JavaScript oder CSS müssen die Versionsparameter in `index.html` aktualisiert werden, damit Browser die neuen Dateien laden.
