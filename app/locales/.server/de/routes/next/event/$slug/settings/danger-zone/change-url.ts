export const locale = {
  explanation:
    "Aktuell ist Dein Event über folgende URL erreichbar: <0>{{baseURL}}/event/{{slug}}</0>. Du kannst den hinteren Teil der URL (Slug) individuell anpassen oder kürzen, um den Link über-sichtlicher zu machen und ihn leichter zu teilen zu können.",
  hint: "<0>Bitte beachte</0>: Ändere die URL <0>nicht</0> mehr, wenn Du sie schon geteilt hast, denn das Event wird nicht mehr über die alte URL erreichbar sein.",
  label: "URL-Slug",
  submit: "URL ändern",
  reset: "Änderung verwerfen",
  validation: {
    slug: {
      minLength: "Der URL-Slug muss mindestens 3 Zeichen lang sein.",
      maxLength: "Der URL-Slug darf maximal 50 Zeichen lang sein.",
      pattern:
        "Der URL-Slug darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten.",
      stillExisting:
        "Der URL-Slug {{slug}} ist bereits vergeben. Bitte wähle einen anderen.",
    },
  },
  errors: {
    updateFailed:
      "Beim Aktualisieren der Event-URL ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: "Die Event-URL wurde erfolgreich aktualisiert.",
} as const;
