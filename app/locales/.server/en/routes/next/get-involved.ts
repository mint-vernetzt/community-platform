export const locale = {
  intro: {
    headline: "Your ideas for the community platform",
    info: "This platform grows with you. To ensure it supports you in your daily life as best as possible, we develop it together with the community. Get involved – with feedback, as a tester, or directly in the development of the platform.",
    image: {
      alt: "An image of community members collaborating.",
      credit: "© Mark Bollhorst",
    },
  },
  secondFundingPhase: {
    headline: "What happens in the second funding phase of MINTvernetzt?",
    info: "Our second funding phase started in January 2026 – with a clear focus on collaboration. The platform is intended to support you even better in finding suitable collaboration partners and sharing knowledge and resources. Particularly important to us is strengthening the networking between school-based and non-school-based actors in MINT education.",
    image: {
      alt: "An image of the funding workshop at a MINTvernetzt conference.",
      credit: "© Mark Bollhorst",
    },
  },
  // typesafe disable via (false as boolean) && { ... }
  // typesafe enable via (true as boolean) && { ... }
  surveyAndResearchCta: (false as boolean) && {
    headline: "Participate in surveys and research projects",
    info: "Help us improve the platform by participating in surveys and research projects.",
    cta: "Participate",
  },
} as const;
