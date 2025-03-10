export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "Es existiert noch kein Profil unter diesem Namen.",
      alreadyOn:
        "Das Profil unter diesem Namen ist bereits auf der Warteliste Eurer Veranstaltung.",
      alreadyParticipant:
        "Das Profil unter diesem Namen nimmt bereits bei Eurer Veranstaltung teil. Bitte entferne die Person erst von der Teilnehmer:innenliste.",
    },
  },
  feedback:
    'Das Profil mit dem Namen "{{firstName}} {{lastName}}" wurde zur Warteliste hinzugefügt.',
  action: "Warteliste",
} as const;
