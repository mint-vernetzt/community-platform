export const locale = {
  error: {
    notFound: "Event not found",
    notProvileged: "Not privileged",
  },
  content: {
    headline: "Die Administrator:innen",
    intro: {
      who: "Wer verwaltet die Veranstaltung auf der Community Plattform? Füge hier weitere Administrator:innen hinzu oder entferne sie.",
      what: "Administrator:innen können Events bearbeiten, veröffentlichen, auf Entwurf zurück stellen, absagen und löschen. Sie sind nicht auf der Event-Detailseite sichtbar.",
      whom: "Team-Mitglieder werden auf der Event-Detailseite gezeigt. Sie können Events im Entwurf einsehen, diese aber nicht bearbeiten.",
    },
    add: {
      headline: "Administrator:in hinzufügen",
      intro:
        "Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.",
    },
    current: {
      headline_one: "Aktuelle Administrator:in",
      headline_other: "Aktuelle Administrator:innen",
      intro_one:
        "Hier siehst Du die Administrator:in der Veranstaltung auf einen Blick.",
      intro_other:
        "Hier siehst Du die Administrator:innen der Veranstaltung auf einen Blick.",
    },
  },
  form: {
    name: {
      label: "Name oder Email",
    },
    remove: {
      label: "Entfernen",
    },
    publish: {
      label: "Veröffentlichen",
    },
    hide: {
      label: "Verstecken",
    },
  },
} as const;
