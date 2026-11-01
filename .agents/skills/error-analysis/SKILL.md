---
name: error-analysis
description: Analysiert Fehler sicher, grenzt Auswirkungen ein und behebt kleine unkritische Ursachen eigenständig.
---

# Fehleranalyse

- Reproduziere den Fehler mit lokalem oder synthetischem Testzustand. Lies relevante Logs nur auf sensible Daten hin; Secrets und produktive Datensätze nicht auslesen oder wiedergeben.
- Prüfe zuerst, ob die Ursache in UI, Browser-Integration, Testumgebung oder geschützter Fach-/Sicherheitslogik liegt.
- Kleine, klar begrenzte Fehler außerhalb geschützter Bereiche darfst du beheben. Änderungen an Dienstplanung/Berechnungen, Benutzerverwaltung, Berechtigungen, Sonderterminlogik, produktiven Daten, Datenbank/Security-Konfiguration oder Secrets benötigen vorher eine konkrete Freigabe.
- Verändere keine produktive Umgebung und führe keine produktiven Migrationen aus.
- Führe passende Regressionstests und die vollständige relevante Suite aus. Trenne bestätigte Ursache von Vermutungen.
- Übergib verständlich: beobachtetes Verhalten, Schritte zur Reproduktion, Ursache (oder offene Hypothesen), Auswirkung, Änderung, Testergebnisse und sichere nächste Schritte. Große oder unsichere Korrekturen vorschlagen und auf Freigabe warten.
