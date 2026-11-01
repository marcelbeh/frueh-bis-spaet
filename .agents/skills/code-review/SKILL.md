---
name: code-review
description: Prüft Änderungen auf Fehler, Regressionen, Sicherheit, Datenschutz, Tests und Einhaltung der Projektfreigaben.
---

# Code-Review

- Prüfe den vollständigen Diff gegen den vorgesehenen Basisbranch und beachte Änderungen anderer Personen.
- Suche zuerst nach Korrektheit, Seiteneffekten, Datenverlust, Berechtigungs-/Datenschutzproblemen, Eingabevalidierung, Fehlerbehandlung und mobilen/UI-Auswirkungen.
- Achte besonders auf versehentliche Änderungen an Planungs- und Berechnungslogik, Benutzerverwaltung, Zugriffsrechten, Sonderterminen, Supabase-Sicherheitsdateien, Secrets und Veröffentlichungsabläufen. Diese Bereiche sind ohne konkrete Freigabe tabu.
- Prüfe, ob Tests die geänderten Verhaltensweisen abdecken und ob die tatsächlichen Workflow-Prüfungen passend sind. Nicht ausgeführte Tests nicht als bestanden werten.
- Nenne zuerst konkrete Befunde nach Schweregrad mit Datei/Zeile und Auswirkung. Wenn keine Befunde vorliegen, nenne die verbleibenden Prüflücken. Keine Veröffentlichung, kein Merge und kein PR ohne ausdrückliche Freigabe.
