# Arbeitsregeln für Früh bis spät

Diese Regeln gelten für das ganze Repository. Spezialisierte Abläufe stehen in `.agents/skills/`.

## Arbeitsweise

- Arbeite selbstständig innerhalb des klar erteilten Auftrags. Prüfe zuerst den bestehenden Code, die Projektstruktur, Git-Änderungen, Tests und Dokumentation. Bewahre fremde oder bereits vorhandene Änderungen.
- Bevorzuge kleine, nachvollziehbare Schritte. Dokumentation, Tests, Bedienbarkeit, Barrierearmut, responsive Darstellung und kleine Wartungsarbeiten darfst du passend zum Auftrag eigenständig verbessern. Größere Umstrukturierungen oder Änderungen außerhalb des Auftrags brauchen vorherige Freigabe.
- Melde eigene Fehler offen, beschreibe die Auswirkung und behebe kleine, sichere Fehler selbst. Berichte größere oder riskante Probleme, bevor du weitergehende Änderungen vornimmst.
- Schreibe verständlich und vollständig: Zweck, geänderte Bereiche, tatsächlich ausgeführte Prüfungen, Ergebnisse, Einschränkungen und notwendige nächste Schritte. Melde Arbeit nur dann als erfolgreich oder abgeschlossen, wenn sie nachweislich erfolgreich war.

## Unveränderliche Schutzgrenzen

Ohne ausdrückliche, konkrete Freigabe des Nutzers darfst du niemals:

- produktive Daten lesen, ändern, löschen, exportieren oder migrieren; für diese Arbeit keine Live-App und keine produktive Supabase-Instanz verwenden;
- Dienstplanlogik oder fachliche Berechnungsregeln verändern, einschließlich Besetzung, Pausen, Arbeitszeitgrenzen, Ruhezeiten, Abwesenheiten, Urlaub, Feiertage, automatische Vorbelegung und Konfliktprüfung;
- Benutzerkonten, Mitarbeiterzugänge, Rollen, Berechtigungen, Authentifizierung oder deren Sicherheitsverhalten ändern;
- Sondertermine, Wiederholungen, Teilnehmerregeln oder deren Auswirkungen auf die Planung/Berechnung verändern;
- Sicherheitskonfiguration, Row-Level-Security, Policies, Datenbankstruktur, Secrets, Schlüssel, Zugangsdaten oder deren Speicherorte ändern;
- Produktionsmigrationen ausführen oder auslösen.

Eine Freigabe muss den betroffenen Bereich und die gewünschte Änderung eindeutig benennen. Ein allgemeiner Auftrag, ein Testfehler oder eine vermeintlich kleine Korrektur ist keine Freigabe. Ist die Abgrenzung unklar, nur analysieren und um Freigabe bitten. Diese Schutzgrenzen gelten auch für Tests, automatische Werkzeuge, CI und Skills.

Secrets niemals ausgeben, auslesen, kopieren, protokollieren oder ändern. Keine produktiven Zugangsdaten in Testen, Logs, Beispielen oder Dokumentation verwenden. Nur synthetische Testdaten und lokale/mocked Dienste verwenden.

## Änderungsfreigaben und Veröffentlichung

- Nutze für jede Arbeit einen separaten Branch und prüfe vor Änderungen Branch und Arbeitsbaum. Ändere `main` nicht direkt.
- Erstelle keinen Pull Request, merge nicht und veröffentliche nicht, solange der Nutzer dies nicht ausdrücklich für den konkreten Stand freigegeben hat.
- Automatische Veröffentlichung ist ausschließlich innerhalb eines bereits ausdrücklich autorisierten und technisch abgesicherten Veröffentlichungsablaufs zulässig. Sie gilt nur für klar abgegrenzte, unkritische Änderungen, wenn die vollständige passende Testsuite erfolgreich war und der Ablauf sie sicher von geschützten Bereichen trennt. Eine Änderung an irgendeinem geschützten Bereich, gemischte Änderungen, fehlende Absicherung oder unklare Zuordnung sperrt automatische Veröffentlichung.
- Größere Änderungen, Änderungen an geschützten Bereichen, Sicherheits- oder Datenbankänderungen sowie Veröffentlichungen benötigen ausdrückliche Freigabe nach vollständiger Prüfung. Fehlgeschlagene oder nicht ausgeführte Tests sperren Veröffentlichung.
- Vorhandene GitHub-Workflow- oder Branch-Regeln prüfen, bevor sie ergänzt werden. Fehlende GitHub-Einstellungen als manuelle Aufgabe dokumentieren; nicht behaupten, eine Einstellung sei aktiv, wenn sie nicht überprüfbar ist.

## Qualität und Tests

- Prüfe die vorhandenen Tests und verwende die passende vollständige Testsuite. Bestehende Projektbefehle nicht durch neue, unbelegte Befehle ersetzen.
- Führe Tests nur in einer lokalen/testisolierten Umgebung aus. Keine Tests, die Live-Daten, echte Konten, produktive APIs oder reale Veröffentlichung berühren.
- Wenn ein Test nicht ausgeführt werden kann, nenne genau den Grund und kennzeichne das Ergebnis als unvollständig. Erfinde keine erfolgreichen Ergebnisse.
- Bei Programmfehlern oder Regressionen zuerst den reproduzierbaren Ablauf und die Auswirkungen feststellen. Größere oder geschützte Ursachen nur nach Freigabe beheben.
- Nutze synthetische und minimale Testdaten. Keine personenbezogenen oder produktiven Daten in Fixtures, Screenshots oder Logs.

## Projektbezug

- Anwendung: statische Browser-App in `index.html`, `app.js`, `styles.css`; Persistenz/Auth über Supabase.
- Tests laut `package.json`: `npm test`, `npm run test:browser`, `npm run test:webkit`. Prüfe die nötigen Browser-Abhängigkeiten vor Ausführung.
- Supabase-Dateien unter `supabase/` können produktive Sicherheits- und Datenbankwirkung haben. Nie ausführen oder deployen, ohne die oben genannte konkrete Freigabe.
- Beim UI/UX: Desktop, Tablet und Smartphone gleichwertig berücksichtigen. PDF/Druck darf verbessert werden, solange dafür keine geschützte Planungs-, Daten- oder Sicherheitslogik verändert wird.
- Halte Dokumentation und Übergaben aktuell. Bewahre die vorhandene Repository-Struktur; lege keine doppelten Regeln oder Skills an.
