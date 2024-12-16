export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Verknüpfte Veranstaltungen",
    assign: {
      headline: "Rahmenveranstaltung zuweisen",
      intro:
        "Welche Veranstaltung ist deiner Veranstaltung übergeordnet? Findet sie  beispielsweise im Rahmen einer Tagung statt? Füge hier deiner Veranstaltung eine Rahmenversanstaltung hinzu oder entferne sie.  Allerdings musst Du Administrator:in der Rahmenveranstaltung sein und deine Veranstaltung muss sich innerhalb des Zeitraums der Rahmenveranstaltung befinden.",
      name: "Name der Veranstaltung",
    },
    parent: {
      headline: "Aktuelle Rahmenveranstaltung",
      intro:
        "Hier siehst Du die aktuelle Rahmenveranstaltung deiner Veranstaltung.",
      empty:
        "Aktuell ist deiner Veranstaltung keine Rahmenveranstaltung zugewiesen.",
      seats: {
        unlimited: " | Unbegrenzte Plätze",
        exact: " | {{number}} / {{total}} Plätzen frei",
        waiting: " | {{number}} auf der Wartelist",
      },
    },
    related: {
      headline: "Zugehörige Veranstaltungen hinzufügen",
      intro:
        "Welche Veranstaltungen sind deiner Veranstaltung untergeordnet? Ist deine Veranstaltung beispielsweise eine Tagung und hat mehrere Unterveranstaltungen, wie Workshops, Paneldiskussionen oder ähnliches? Dann füge ihr hier andere zugehörige Veranstaltungen hinzu oder entferne sie. Beachte, dass Du Administrator:in in den zugehörigen Veranstaltungen sein musst und, dass die zugehörigen Veranstaltungen im Zeitraum deiner Veranstaltung stattfinden müssen.",
      name: "Name der Veranstaltung",
    },
    current: {
      headline: "Aktuelle zugehörige Veranstaltungen",
      intro:
        "Hier siehst Du die aktuellen zugehörigen Veranstaltung deiner Veranstaltung.",
      empty:
        "Aktuell besitzt deine Veranstaltung keine zugehörigen Veranstaltungen.",
      seats: {
        unlimited: " | Unbegrenzte Plätze",
        exact: " | {{number}} / {{total}} Plätzen frei",
        waiting: " | {{number}} auf der Wartelist",
      },
    },
  },
  form: {
    remove: {
      label: "entfernen",
    },
    publish: {
      label: "Veröffentlichen",
    },
    hide: {
      label: "Verstecken",
    },
  },
} as const;
