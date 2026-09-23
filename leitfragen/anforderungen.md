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
  
Die fachlichen Anforderungen an einen Zahlungsdienstleister aus Sicht eines Parkraumbetreibers ergeben sich aus mehreren unterschiedlichen Punkten. Dadurch, dass in diesem Fall keine dauerhafte Internetverbindung bestehen kann, sollte auch der Zahlungsdienst ohne Internetverbindung funktionieren, unter anderem via Polling. Dadurch ergibt sich auch die Anforderung, dass ein Zahlungsdienst hochverfügbar sein muss, damit die parkenden Kunden zu jedem beliebigen Zeitpunkt zahlen können. Es sollte auch möglich sein beliebige Zahlungsbeträge, die man den Kunden in Rechnung stellt, möglich bzw. zur Auswahl verfügbar sein. 
