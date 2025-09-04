export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Verantwortliche Organisationen",
    add: {
      headline: "Organisation hinzufügen",
      intro:
        "Füge hier Deinem Event eine bereits bestehende Organisation hinzu.",
      label: "Name der Organisation",
    },
    own: {
      headline: "Eigene Organisationen hinzufügen",
      intro:
        "Hier werden dir Deine eigenen Organisationen vorgeschlagen um sie auf einen Klick als verantwortliche Organisationen hinzuzufügen.",
      label: "Hinzufügen",
    },
    current: {
      headline: "Organisationen",
      intro:
        "Hier siehst Du alle für das Event verantwortlichen Organisationen auf einen Blick.",
      remove: "entfernen",
    },
    publish: "Veröffentlichen",
    hide: "Verstecken",
  },
} as const;
