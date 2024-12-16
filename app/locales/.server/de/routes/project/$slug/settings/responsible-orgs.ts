export const locale = {
  error: {
    invalidRoute: "No valid route",
    notFound: "Not found",
  },
  content: {
    added: "{{name}} hinzugefügt.",
    back: "Verantwortliche Organisationen",
    intro:
      "Welche Organisationen stecken hinter dem Projekt? Verwalte hier die verantwortlichen Organisationen.",
    current: {
      headline: "Aktuell hinzugefügte Organisation(en)",
      intro:
        "Hier siehst Du Organisationen, die aktuelle als verantwortliche Organisation hinterlegt wurden.",
      remove: "Entfernen",
    },
    add: {
      headline: "Eigene Organisation(en) hinzufügen",
      intro:
        "Hier werden Dir Deine eigenen Organisationen aufgelistet, so dass Du sie mit einen Klick als verantwortliche Organisationen hinzuzufügen kannst.",
      add: "Hinzufügen",
    },
    other: {
      headline: "Andere Organisation(en) hinzufügen",
      search: {
        label: "Suche",
        helper: "Mindestens 3 Buchstaben.",
      },
      add: "Hinzufügen",
    },
  },
} as const;
