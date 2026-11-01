# Noch manuell zu prüfende GitHub-Einstellungen

Die Codex-Einrichtung kann Branch-Regeln und Repository-Einstellungen nicht zuverlässig per vorhandener GitHub-Verbindung setzen. Die Verbindung lieferte für die Branch-Schutzabfrage `403 Resource not accessible by integration`. Die API-Branchliste markiert `main` als `protected: false`; das ist kein ausreichender Nachweis, dass alle Rulesets geprüft wurden.

Bitte in GitHub unter **Settings → Rules → Rulesets** (und gegebenenfalls **Branches**) für `main` einrichten und kontrollieren:

1. Änderungen an `main` nur über Pull Requests zulassen.
2. Mindestens eine menschliche Freigabe verlangen, insbesondere bei geschützten Bereichen.
3. Erfolgreiche Pflichtprüfungen verlangen (vorhandener Testworkflow: `.github/workflows/tests.yml`); keine erfolgreiche Ausführung darf übersprungen werden.
4. Direktes Pushen und Force-Push verhindern; Administrator-Ausnahmen nur bewusst vergeben.
5. Automatische Veröffentlichung auf `main` beschränken und nur nach erforderlichen Prüfungen zulassen. Geschützte Änderungen brauchen zusätzlich die vereinbarte ausdrückliche Freigabe.
6. Prüfen, ob GitHub Pages aus `main` veröffentlicht und ob weitere Actions/Releases veröffentlichen können. Es wurde kein separater Deployment-Workflow gefunden; Repository-/Pages-Einstellungen waren über die Verbindung nicht prüfbar.

Diese Einrichtung hat keinen Pull Request erstellt und `main` nicht geändert. Eine manuelle Regel verhindert nicht allein jede unsichere Veröffentlichung; Workflow- und Pages-Auslöser ebenfalls kontrollieren.
