---
name: ui-ux
description: Verbessert Bedienbarkeit, Gestaltung, Barrierearmut und responsive Nutzung der App ohne geschützte Fachlogik zu verändern.
---

# UI/UX

- Ermittle vor Änderungen bestehende Muster in `index.html`, `styles.css` und `app.js`; vermeide parallele oder doppelte Komponenten.
- Berücksichtige Desktop, Tablet und Smartphone gleichwertig: klare Hierarchie, verständliche Beschriftungen, passende Touch-Ziele, Tastaturbedienung, Fokuszustände, Kontrast und sinnvolle schmale Ansichten.
- PDF und Druck dürfen aktiv verbessert werden, wenn deren Arbeit keine Dienstplan-/Berechnungsregeln, Auth, Rechte, produktive Daten oder Sicherheitskonfiguration verändert.
- Keine Änderungen an geschützten Planungs-, Abwesenheits-, Urlaubs-, Feiertags-, Sondertermin- oder Berechtigungsregeln ohne vorherige konkrete Freigabe. Eine rein visuelle Änderung darf deren Verhalten nicht stillschweigend verändern.
- Prüfe die vorhandenen visuellen/browserbasierten Tests in isolierter Umgebung. Keine echten Konten oder Produktionsdaten verwenden.
- Beschreibe sichtbar geänderte Abläufe und bekannte Einschränkungen; teste die betroffenen Ansichten bei mehreren Bildschirmbreiten, soweit verfügbar.
