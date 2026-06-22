export const locale = {
  list: {
    title: "Aktuelle Teilnehmende",
    subline:
      "Hier findest Du alle Personen, die sich für Dein Event angemeldet haben. Du kannst die Liste durchsuchen und als CSV-Datei downloaden.",
    sublineWithChilds:
      "Hier findest du alle Personen, die sich für dein Rahmenevent angemeldet haben. Du kannst die Liste durchsuchen und zusätzlich eine erweiterte Liste als CSV-Datei downloaden. Diese Liste enthält zusätzlich alle Teilnehmenden der Unterevents. Jede Person wird nur einmal gelistet, auch wenn sie sich für mehrere Events angemeldet hat.",
    fullDepthParticipantsCount:
      "Anzahl der Teilnehmenden inklusive Unterevents: {{count}}",
    parentParticipationNotRequiredHint:
      "Du hast eingestellt, dass sich Personen nur für die Unterevents anmelden können und kannst daher hier ausschließlich die erweiterte CSV-Liste mit allen Teilnehmenden der Unterevents herunterladen.",
    search: {
      label: "Suche Personen",
      placeholder: "Name oder E-Mail-Adresse",
    },
    item: {
      subline: "Angemeldet am {{date}}",
      remove: "Entfernen",
    },
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    confirmation: {
      title:
        "Willst Du wirklich {{firstName}} {{lastName}} von der Teilnehmer:innenliste entfernen?",
      description: "Die entfernte Person wird per Mail informiert.",
      submit: "Entfernen",
      abort: "Abbrechen",
    },
  },
  download: {
    title: "CSV-Datei Download",
    subline:
      "Lade hier die Liste der Teilnehmenden als CSV mit Name, Position, E-Mail-Adresse und den Events an denen sie teilnehmen herunter.",
    sublineWithChilds:
      "Lade hier die erweiterte Liste der Teilnehmenden als CSV mit Name, Position, E-Mail-Adresse und den Events an denen sie teilnehmen herunter. Diese Liste enthält zusätzlich alle Teilnehmenden der Unterevents. Jede Person wird nur einmal gelistet, auch wenn sie sich für mehrere Events angemeldet hat.",
    hint: "<0>Hinweis zum Datenschutz</0>: Nutze die Teilnehmenden-Daten nur zur Organisation Deines Events und gib sie nicht weiter. Mit dem Download übernimmst Du Verantwortung für einen datenschutzkonformen Umgang. Details findest Du in unserer <1>Datenschutzerklärung</1> und den <2>Nutzungsbedingungen</2>.",
    action: "CSV-Datei speichern",
  },
  mail: {
    removeParticipant: {
      subject: "Du wurdest als Teilnehmer:in von einem Event entfernt",
    },
    moveFromWaitingListToParticipants: {
      subject:
        "Du wurdest von der Warteliste zu den Teilnehmenden eines Events hinzugefügt",
    },
  },
  errors: {
    removeParticipant:
      "Das Entfernen der Person ist fehlgeschlagen. Bitte versuche es erneut.",
  },
  success: {
    removeParticipant:
      "Die Person wurde von der Teilnehmer:innenliste entfernt",
  },
} as const;
