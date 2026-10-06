export const locale = {
  intro: {
    headline: "Deine Ideen für die Community-Plattform",
    info: "Diese Plattform wächst mit Dir. Damit sie Dich im Alltag bestmöglich unterstützt, entwickeln wir sie gemeinsam mit der Community weiter. Bring Dich ein – mit Feedback, als Tester:in oder direkt bei der Entwicklung der Plattform.",
    image: {
      alt: "Ein Bild von Community Mitgliedern die mitgestalten.",
      credit: "© Mark Bollhorst",
    },
  },
  secondFundingPhase: {
    headline: "Was passiert in der zweiten Förderphase von MINTvernetzt?",
    info: "Unsere zweite Förderphase ist im Januar 2026 gestartet – mit einem klaren Fokus auf Zusammenarbeit. Die Plattform soll Dich noch besser dabei unterstützen, passende Kollaborationspartner:innen zu finden und Wissen sowie Ressourcen zu teilen. Beson-ders wichtig ist uns dabei die Stärkung der Vernetzung zwischen schulischen und außer-schulischen Akteur:innen in der MINT-Bildung.",
    image: {
      alt: "Ein Bild des Förderworkshops auf einer MINTvernetzt Tagung.",
      credit: "© Mark Bollhorst",
    },
  },
  // typesafe disable via (false as boolean) && { ... }
  // typesafe enable via (true as boolean) && { ... }
  surveyAndResearchCta: (false as boolean) && {
    headline: "Nimm an Umfragen und Forschungsprojekten teil",
    info: "Hilf uns, die Plattform zu verbessern, indem Du an Umfragen und Forschungsprojekten teilnimmst.",
    cta: "Mitmachen",
  },
  getInvolved: {
    headline: "Gestalte und entwickle mit uns",
    info: "Werde Teil der Open-Source-Entwicklung. Bring Dich als Designer:in oder Programmierer:in ein und arbeite mit uns an Features, die echten Mehrwert schaffen.",
    email: {
      subject: "Mitwerkeln%20als%20Designer%3Ain%20%2F%20Programmierer%3Ain",
      cta: "Mitwirken",
    },
    github: {
      cta: "Zu Github",
    },
  },
} as const;
