---
name: testing
description: Wählt und führt die vorhandenen sicheren Tests für Früh bis spät aus und berichtet nur belegte Ergebnisse.
---

# Testing

- Prüfe `package.json`, Testdateien und den bestehenden GitHub-Testworkflow vor Ausführung.
- Projektbefehle: `npm test` (Node-Kerntests), `npm run test:browser` (Playwright-Browser), `npm run test:webkit` (Playwright WebKit). Prüfe Paketinstallation und Browserverfügbarkeit; führe nicht blind Tests gegen Live-Dienste aus.
- Nutze nur synthetische Fixtures, lokale Server und Mocks. Keine produktiven Auth-Konten, Datenbanken, API-Schlüssel, Migrationen oder Live-App.
- Für veröffentlichungsfähige Änderungen muss die vollständige passende Testsuite erfolgreich sein. Prüfe Testausgaben und Exit-Code; überspringe fehlschlagende Prüfungen nicht.
- Bei fehlenden Abhängigkeiten, Plattformbeschränkungen oder nicht verfügbaren Browsern das Hindernis und die nicht ausgeführten Tests präzise nennen.
- Ein bestandener Test beweist nur das geprüfte Verhalten; keine Aussagen über reale Datenbankpolicies oder ungetestete Geräte ableiten.
