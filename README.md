# Früh bis spät – Der Kita-Dienstplaner

Erster UI-Prototyp für eine zentrale Kita-Dienstplanung.

## Start

Die erste Version besteht aus statischen Dateien und benötigt keinen Build-Schritt:
- `index.html`
- `styles.css`
- `app.js`

Du kannst `index.html` lokal öffnen oder GitHub Pages aktivieren: **Settings → Pages → Deploy from a branch → `main` / `/(root)`**.

## Enthaltene Prototyp-Seiten

- Dashboard mit Wochenvorschau, Kennzahlen und Warnungen
- Dienstplan: Montag bis Sonntag, 06:00–22:00 Uhr, maßstabsgetreue Zeitblöcke; Dienste lassen sich anklicken und bearbeiten
- Kalender
- Mitarbeitende
- Urlaub & Abwesenheit
- Sondertermine
- Teammeetings
- Supervision
- Fortbildungen
- Auswertungen
- Einstellungen

## Wichtige Hinweise

- Die aktuelle Oberfläche startet mit zehn Beispieldatensätzen für Mitarbeitende in den drei Gruppen Nest, Sonnengruppe und Sternengruppe. Beispieldaten können bearbeitet oder entfernt werden.
- Änderungen bleiben derzeit nur im Speicher der geöffneten Browser-Sitzung und gehen beim Neuladen verloren. Das gilt auch für neu angelegte oder entfernte Mitarbeitende.
- Es gibt noch keine Anmeldung, Datenbank, echte Dienstplanoptimierung oder rechtliche Arbeitszeitprüfung.
- Keine echten personenbezogenen Daten in diesem Prototyp verwenden.
- Vor produktiver Nutzung müssen sichere Speicherung, Zugriffsschutz, Datensicherung, Arbeitszeitregeln und die Planungslogik fachlich und technisch umgesetzt und geprüft werden.

## Nächste Schritte

1. Oberfläche und Navigation testen.
2. Gruppen, Mitarbeitendenregeln und Dienstmodelle fachlich konkretisieren.
3. Datenmodell und sichere Speicherung planen.
4. Validierungsregeln und danach Optimierungslogik entwickeln.


## Dienstplan-Vorbelegung und Wochenkopie

- Über **Einstellungen** lassen sich Beginn und Ende der allgemeinen Rahmenzeit sowie die Mindestbesetzung je Gruppe festlegen. Es gibt einen normalen Diensttyp und kategorisierte Sonderdienste.
- **Automatisch vorbelegen** erstellt einen bearbeitbaren Wochenentwurf aus den angelegten Mitarbeitenden und ihren Wochenstunden. Der Entwurf verteilt die Wochenstunden auf fünf Werktage und prüft Mindestbesetzungen in Zwei-Stunden-Fenstern.
- **Woche kopieren** kopiert die Dienste der angezeigten Woche in die Folgewoche. Bereits vorhandene Dienste der Zielwoche werden nach Bestätigung ersetzt.
- Wochenbezogene Dienste werden im Prototyp getrennt geführt.
- Kriterien und Dienstpläne sind noch nicht dauerhaft gespeichert und gehen beim Neuladen verloren. Die automatische Vorbelegung berücksichtigt noch keine individuellen freien Tage, Abwesenheiten, Pausen, besondere Endzeiten oder gesetzlichen Ruhezeiten. Den Entwurf vor Nutzung immer manuell prüfen.
