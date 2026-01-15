export const locale = {
  title: "Aktuelle Administrator:innen",
  explanation:
    "<0>Bitte beachte</0>: Es muss <0>mindestens eine:n Admin</0> geben. ",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Administrator:innen suchen...",
    remove: "Entfernen",
  },
  confirmation: {
    title: "Willst Du Dich wirklich als Admin entfernen?",
    description:
      "Wenn Du Dich als Admin entfernst, hast Du keinen Zugriff mehr auf die Bearbeitung Deines Events.",
    confirm: "Als Admin entfernen",
    abort: "Abbrechen",
  },
  errors: {
    removeLastAdmin: "Du kannst den letzten Admin des Events nicht entfernen.",
    removeAdminFailed: "Das Entfernen des Admins ist fehlgeschlagen.",
  },
  success: {
    removeSelfAsAdmin:
      "Du hast Dich erfolgreich als Admin vom Event {{eventName}} entfernt.",
    removeAdmin: "Der Admin wurde erfolgreich entfernt.",
  },
} as const;
