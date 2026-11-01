---
name: release-management
description: Bereitet sichere Releases vor und veröffentlicht nur innerhalb der ausdrücklich freigegebenen Grenzen.
---

# Release-Management

- Prüfe Basisbranch, Diffs, Workflow-Auslöser, Release-/Pages-Konfiguration, Branch-Schutz und vollständige passende Testergebnisse.
- Standardmäßig nur vorbereiten und berichten. Niemals direkt nach `main` schreiben, einen PR erstellen, mergen oder veröffentlichen, solange die konkrete Nutzerfreigabe fehlt.
- Automatische Veröffentlichung ist nur für klar isolierte, unkritische Änderungen nach erfolgreicher vollständiger Testsuite zulässig. Gemischte, unklare oder geschützte Änderungen sperren sie.
- Änderungen an Dienstplan-/Berechnungslogik, Benutzerverwaltung, Berechtigungen, Sonderterminen, Datenbank-/Sicherheitskonfiguration, Secrets, produktiven Daten oder Migrationen benötigen ausdrückliche Freigabe und manuelle Prüfung.
- Secrets nie öffnen oder ausgeben. Supabase-Skripte niemals durch einen Release-Workflow auf eine produktive Instanz anwenden.
- Berichte enthalten enthaltene Änderungen, tatsächlich bestandene Prüfungen, fehlgeschlagene/nicht ausgeführte Prüfungen und manuelle GitHub-Einstellungen. Nicht verfügbare Branch-Protection-Information klar als ungeprüft kennzeichnen.
