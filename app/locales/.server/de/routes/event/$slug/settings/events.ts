export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Verknüpfte Events",
    assign: {
      headline: "Rahmenveranstaltung zuweisen",
      intro:
        "Welche Veranstaltung ist Deiner Veranstaltung übergeordnet? Findet sie  beispielsweise im Rahmen einer Tagung statt? Füge hier Deiner Veranstaltung eine Rahmenversanstaltung hinzu oder entferne sie. Allerdings musst Du Administrator:in der Rahmenveranstaltung sein und deine Veranstaltung muss sich innerhalb des Zeitraums der Rahmenveranstaltung befinden.",
      name: "Name des Events",
    },
    parent: {
      headline: "Aktuelle Rahmenveranstaltung",
      intro:
        "Hier siehst Du die aktuelle Rahmenveranstaltung Deiner Veranstaltung.",
      empty:
        "Aktuell ist Deiner Veranstaltung keine Rahmenveranstaltung zugewiesen.",
      seats: {
        unlimited: " | Unbegrenzte Plätze",
        exact: " | {{number}} / {{total}} Plätzen frei",
        waiting: " | {{number}} auf der Wartelist",
      },
    },
    related: {
      headline: "Zugehörige Events hinzufügen",
      intro:
        "Welche Veranstaltungen sind Deiner Veranstaltung untergeordnet? Ist Deine Veranstaltung beispielsweise eine Tagung und hat mehrere Unterveranstaltungen, wie Workshops, Paneldiskussionen oder ähnliches? Dann füge ihr hier andere zugehörige Veranstaltungen hinzu oder entferne sie. Beachte, dass Du Administrator:in in den zugehörigen Veranstaltungen sein musst und, dass die zugehörigen Veranstaltungen im Zeitraum Deiner Veranstaltung stattfinden müssen.",
      name: "Name des Events",
    },
    current: {
      headline: "Aktuelle zugehörige Events",
      intro:
        "Hier siehst Du die aktuellen zugehörigen Events Deiner Veranstaltung.",
      empty: "Aktuell besitzt Deine Veranstaltung keine zugehörigen Events.",
      seats: {
        unlimited: " | Unbegrenzte Plätze",
        exact: " | {{number}} / {{total}} Plätzen frei",
        waiting: " | {{number}} auf der Warteliste",
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
