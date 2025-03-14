export const locale = {
  error: {
    missingParameterSlug: 'Route parameter "slug" not found',
    invalidRoute: "No valid route",
  },
  validation: {
    slug: {
      min: "Es werden mind. 3 Zeichen benötigt.",
      max: "Es sind max. 50 Zeichen erlaubt.",
      regex: "Nur Buchstaben, Zahlen und Bindestriche erlaubt.",
      unique: "Diese URL ist bereits vergeben.",
    },
  },
  content: {
    label: "Organisations-URL",
    feedback: "URL wurde geändert.",
    prompt:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    reach:
      "Aktuell ist Deine Organisation über folgende URL <0>{{url}}<1>{{slug}}</1></0> zu erreichen.",
    note: "Wenn Du die URL deiner Organisation änderst und den bisherigen Link bereits geteilt hast, wird die Organisation über den alten Link nicht mehr erreichbar sein.",
    action: "URL ändern",
  },
} as const;
