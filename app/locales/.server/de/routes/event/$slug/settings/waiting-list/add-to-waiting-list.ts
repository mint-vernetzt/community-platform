export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "Unter diesem Namen wurde keine Person gefunden.",
      alreadyOn:
        "Eine Person mit diesem Namen ist bereits auf der Warteliste Eurer Veranstaltung.",
      alreadyParticipant:
        "Eine Person mit diesem Namen nimmt bereits bei Eurer Veranstaltung teil. Bitte entferne die Person erst von der Teilnehmer:innenliste.",
    },
  },
  feedback:
    'Das Profil mit dem Namen "{{firstName}} {{lastName}}" wurde zur Warteliste hinzugefügt.',
  action: "Warteliste",
} as const;
