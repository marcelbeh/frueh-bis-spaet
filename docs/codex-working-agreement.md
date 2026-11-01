# Codex-Arbeitsvereinbarung

Dieses Dokument fasst die Projektregeln für Menschen zusammen. Verbindlich ist `AGENTS.md`; die sechs spezialisierten Abläufe liegen in `.agents/skills/`.

## Leitlinie

Codex arbeitet selbstständig mit nachvollziehbarer Kontrolle. Kleine, unkritische Verbesserungen an Fehlern, Gestaltung, PDF/Druck, Tests und Dokumentation sind im jeweiligen Auftrag möglich. Größere Umstrukturierungen werden vorher abgestimmt. Berichte verwenden einfache Sprache und unterscheiden belegte Ergebnisse von offenen Punkten.

## Geschützte Bereiche

Produktive Daten, Dienstplan- und Berechnungslogik, Benutzerverwaltung, Berechtigungen, Sondertermine samt Berechnungsfolgen sowie Sicherheitskonfiguration sind besonders geschützt. Dafür ist vor jeder Änderung eine ausdrückliche, konkrete Freigabe erforderlich. Keine Live-Daten, produktiven Migrationen, Secrets oder produktive Konten in Entwicklung und Tests verwenden.

## Prüfung und Veröffentlichung

Änderungen entstehen auf getrennten Branches. Tests laufen lokal oder in einer isolierten CI-Umgebung mit synthetischen Daten. Vollständige erfolgreiche passende Tests sind Voraussetzung für eine Veröffentlichung. Automatik ist auf klar abgegrenzte unkritische Änderungen beschränkt. Geschützte oder größere Änderungen benötigen Freigabe. PR, Merge und Veröffentlichung erfolgen nur nach ausdrücklicher Freigabe.

## Projektspezifischer Testumfang

Die vorhandenen Befehle sind in `package.json` definiert:

- `npm test`
- `npm run test:browser`
- `npm run test:webkit`

Browserinstallationen können lokal oder in CI nötig sein. Die Tests ersetzen keine Prüfung der echten Supabase-Sicherheit und rechtfertigen keinen Zugriff auf Live-Daten.
