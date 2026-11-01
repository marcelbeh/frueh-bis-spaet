---
name: feature-development
description: Entwickelt freigegebene Funktionen für Früh bis spät innerhalb der Projektstruktur und der festgelegten Schutzgrenzen.
---

# Feature-Entwicklung

1. Lies `AGENTS.md`, `README.md`, die betroffenen Dateien und vorhandene Tests. Prüfe Branch und Arbeitsbaum und arbeite auf einem eigenen Branch.
2. Schreibe das gewünschte Verhalten und den Umfang knapp auf. Suche gezielt nach Berührung mit Dienstplan-/Berechnungslogik, Benutzerverwaltung, Sonderterminen, Daten, Berechtigungen, Supabase oder Sicherheitskonfiguration.
3. Bei Berührung mit einem geschützten Bereich: nur untersuchen und einen konkreten Änderungsvorschlag vorbereiten. Erst nach ausdrücklicher Freigabe fortfahren.
4. Implementiere die kleinste vollständige Änderung, passend zur bestehenden Struktur (`index.html`, `app.js`, `styles.css`, `tests/`, `docs/`). Bestehende Fremdänderungen erhalten.
5. Nutze ausschließlich synthetische Daten und lokale oder gemockte Abhängigkeiten. Keine Live-App, produktive Daten, Secrets, produktiven Migrationen oder echten Konten.
6. Prüfe die passenden vorhandenen Tests und führe die vollständige relevante Suite aus. Keine Veröffentlichung bei fehlgeschlagenen oder nicht ausgeführten Tests.
7. Berichte Änderungen, Testbefehle und echte Ergebnisse, Einschränkungen sowie erforderliche Nutzerfreigaben. PR, Merge und Veröffentlichung nur nach konkreter Freigabe.
