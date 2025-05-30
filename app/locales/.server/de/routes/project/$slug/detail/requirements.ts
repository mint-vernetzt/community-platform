export const locale = {
  error: {
    invariant: {
      invalidRoute: "No valid route",
      notFound: "Not found",
    },
  },
  content: {
    information:
      "Die Informationen zu finanziellem und personellem Rahmen beziehen sich auf das angegebene Projekt, nicht allgemein auf die Organisation.",
    confirmation:
      "Informationen zu den Rahmenbedingungen wurden noch nicht eingetragen",
    timeFrame: {
      headline: "Zeitlicher Rahmen",
      intro: "Projektstart bzw. Projekt-Zeitraum",
    },
    jobFillings: {
      headline: "Personelle Situation",
      intro: "Stellen und/oder Stundenkontingent",
    },
    furtherJobFillings: {
      headline: "Weitere Infos",
    },
    finance: {
      headline: "Finanzieller Rahmen",
      yearlyBudget: "Jährliches Budget",
      financings: "Art der Finanzierung",
      moreInformation: "Weitere Infos",
    },
    technical: {
      headline: "Technischer Rahmen",
      technicalRequirements: "Software / Hardware / Bausätze / Maschinen",
      furtherTechnicalRequirements: "Sonstiges",
    },
    rooms: {
      headline: "Räumliche Situation",
      roomSituation: "Arbeitsorte",
      furtherRoomSituation: "Weitere Informationen",
    },
  },
} as const;
