export const locale = {
  error: {
    profileNotFound: "Profile not found",
  },
  content: {
    welcome: "Welcome,",
    community: "to your MINTvernetzt Community!",
    myProfile: "View my profile",
    notifications: {
      headline: "Notifications",
      hide: "Hide notifications",
      show: "Show notifications",
      canceled: "Event canceled",
      cta: "To my events",
      showMore: "Show more",
      showLess: "Show less",
    },
    updateTeasers: {
      headline: "Updates",
      hide: "Hide updates",
      show: "Show updates",
      faq: {
        headline: "Support",
        description:
          "New help page with answers to questions about the platform",
        linkDescription: "View now",
      },
      entries: {
        createProject: {
          headline: "Share knowledge",
          description: "Create your own project or publish an existing draft",
          linkDescription: "Create now",
        },
        addToOrganization: {
          headline: "New functionality",
          description: "Add yourself to organizations",
          linkDescription: "Try now",
        },
        crawler: {
          headline: "New beta feature",
          description: "Test our funding search now",
          linkDescription: "Try now",
        },
        mediaDatabase: {
          headline: "New feature",
          description:
            "Find free STEM related images and graphics in the STEM media database",
          linkDescription: "Try out now",
        },
      },
    },
    newsTeaser: {
      headline: "MINTvernetzt News",
      hide: "Hide news",
      show: "Show news",
      entries: {
        tableMedia: {
          headline: "New cooperation",
          description:
            "Offer: table.media subscription for MINTvernetzt Community",
          linkDescription: "Learn more now",
        },
        annualConference: {
          headline: "Register now",
          description:
            "Program and hotel information for our annual conference from 11.-12.2.24 in Berlin published",
          linkDescription: "Learn more",
        },
      },
    },
    communityCounter: {
      headline: "HOW OUR COMMUNITY IS GROWING",
      profiles: "Profiles",
      organizations: "Organizations",
      events: "Events",
      projects: "Projects",
    },
    profiles: "Profiles",
    allProfiles: "All profiles",
    organizations: "Organizations",
    allOrganizations: "All organizations",
    events: "Events",
    allEvents: "All events",
    projects: "Projects",
    allProjects: "All projects",
    externalTeasers: {
      headline: "More about MINTvernetzt",
      entries: {
        website: {
          headline: "Your networking office",
          description: "Learn more about MINTvernetzt",
          linkDescription: "To the MINTvernetzt website",
        },
        dataLab: {
          headline: "MINT-DataLab",
          description: "Find analyses, graphics and statistics about STEM",
          linkDescription: "To the MINT-DataLab",
        },
        meshMint: {
          headline: "MesH_MINT",
          description: "Highlights from educational research",
          linkDescription: "To MesH_MINT",
        },
      },
    },
    invites: {
      headline_one: "You have received {{count}} invitation.",
      headline_other: "You have received {{count}} invitations.",
      description:
        "Answer the request and become visible as a team member of the organization.",
      linkDescription: "To my organizations",
    },
    requests: {
      headline_one: "You have {{count}} open membership request.",
      headline_other: "You have {{count}} open membership requests.",
      description: "Respond to membership requests for your organizations.",
      linkDescription: "To my organizations",
    },
  },
} as const;
