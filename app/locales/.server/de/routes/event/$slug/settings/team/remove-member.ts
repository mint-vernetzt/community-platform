export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    minimum:
      "Es muss immer ein Teammitglied geben. Bitte füge zuerst jemand anderen als Teammitglied hinzu.",
    inputError: {
      doesNotExist: "Unter diesem Namen wurde keine Person gefunden.",
      alreadyIn:
        "Eine Person mit diesem Namen ist bereits Teammitglied Eurer Veranstaltung.",
    },
  },
  feedback:
    'Ein neues Teammitglied mit dem Namen "{{firstName}} {{lastName}}" wurde hinzugefügt.',
} as const;
