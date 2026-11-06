# Datumsreparatur V0.4.5

Die ursprüngliche Reparaturdatei `repair.mjs` muss vor Veröffentlichung auf Kompatibilität mit `lib/core.js` und dem tatsächlichen Audit geprüft werden. Bis dahin **nicht** ausführen.

Auf dem Armor liegen die Mailpasswörter ausschließlich unter `~/.config/glockenkurve/mail-credentials.sh` (chmod 600). Diese Datei sowie `reports/` dürfen niemals öffentlich hochgeladen werden.

Geprüfte Ausgangslage: 23 Audit-Probleme, davon 14 Datumsabweichungen, 7 fehlende und 2 mehrdeutige Zuordnungen. Kein automatisches Löschen.
