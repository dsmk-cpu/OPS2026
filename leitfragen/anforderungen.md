# Fachliche Anforderungen
- Muss ohne dauerhafte Internetverbindung funktionieren
- Hochverfügbar -> Kunden können immer zahlen
- Beliebige Zahlungsbeträge können festgelegt werden
- Zahlungsstatus muss korrekt aktualisiert werden (z.B. bei eingehender Zahlung)
- Keine doppelten Zahlungen (Bsp.: man klickt zweimal hintereinander auf "Zahlen" -> nur eine Zahlung soll akzeptiert und verarbeitet werden)
- Zahlungen müssen eindeutig zum Kennzeichen zugeordnet werden
- Logs zu den Zahlungen sichtbar für Besitzer
- Mehrere Zahlungen gleichzeitig
- Möglichst einfache Zahlung (wenig Daten, schnell)
- Kunde muss sehen an wen sein Geld gesendet wird (was er bezahlt)
- Zahlungsbestätigung
- Betreiber will nicht verantwortlich sein für Rahmenbedingungen (Kundendaten, etc.) -> PCI-DSS, Datenschutz
- Dienstleistung (von PSP) muss für Betreiber wirtschaftlich sein
- Verbreiteter Dienstleister
- Manuelle Zahlungskorrektur (Beschwerden von Kunden)
- Verschiedene Währungen möglich
- Dienstleister kann verschiedene Zahlungsmethoden anbieten (Lastschrift, Pay-Later, ...)
  
