export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError:
      "Achtung! Es nehmen bereits mehr Personen teil als die aktuell eingestellte Teilnahmebegrenzung. Bitte zuerst die entsprechende Anzahl der Teilnehmenden zur Warteliste hinzufügen.",
  },
  validation: {
    participantLimit: {
      type: "Bitte eine Zahl eingeben",
    },
  },
  content: {
    headline: "Teilnehmende",
    intro:
      "Wer nimmt an der Veranstaltung teil? Füge hier weitere Teilnehmende hinzu oder entferne sie. Außerdem kannst Du eine Begrenzung der Teilnehmenden festlegen.",
    limit: {
      headline: "Begrenzung der Teilnehmenden",
      intro:
        "Hier kann die Teilnehmerzahl begrenzt werden. Auch wenn die Teilnehmerzahl erreicht ist kannst Du später noch manuell Personen von der Warteliste zu den Teilnehmenden verschieben.",
      label: "Begrenzung der Teilnehmenden",
      submit: "Speichern",
      feedback: "Deine Informationen wurden aktualisiert.",
    },
    add: {
      headline: "Teilnehmende hinzufügen",
      intro:
        "Füge hier Eurer Veranstaltung ein bereits bestehendes Profil als Teilnehmende hinzu.",
      label: "Name oder Email der Teilnehmer:in",
    },
    current: {
      headline: "Aktuelle Teilnehmende",
      intro: "Hier siehst Du alle Teilnehmenden auf einen Blick.",
      download1: "Teilnehmerliste herunterladen",
      download2: "Teilnehmerliste aller Subveranstaltungen herunterladen",
      remove: "entfernen",
    },
    hide: "Verstecken",
    publish: "Veröffentlichen",
  },
} as const;
