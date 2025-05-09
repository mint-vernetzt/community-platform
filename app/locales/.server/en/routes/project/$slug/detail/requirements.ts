export const locale = {
  error: {
    invariant: {
      invalidRoute: "No valid route",
      notFound: "Not found",
    },
  },
  content: {
    information:
      "The financial and staffing information relates to the specified project, not to the organization in general.",
    confirmation:
      "Information about the general conditions has not yet been entered",
    timeFrame: {
      headline: "Timeframe",
      intro: "Project start or project period",
    },
    jobFillings: {
      headline: "Personnel situation",
      intro: "Positions and/or hourly quota",
    },
    furtherJobFillings: {
      headline: "Further information",
    },
    finance: {
      headline: "Financial frame",
      yearlyBudget: "Yearly budget",
      financings: "Type of financing",
      moreInformation: "Further information",
    },
    technical: {
      headline: "Technical frame",
      technicalRequirements: "Software / Hardware / Kits / Machines",
      furtherTechnicalRequirements: "Further information",
    },
    rooms: {
      headline: "Spatial situation",
      roomSituation: "Places of work",
      furtherRoomSituation: "Further information",
    },
  },
} as const;
