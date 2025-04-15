export const locale = {
  error: {
    profileNotFound: "Profile not found",
  },
  content: {
    notifications: {
      headline: "Notifications",
      hide: "Hide notifications",
      show: "Show notifications",
      canceled: "Event canceled",
      cta: "To my events",
      showMore: "Show more",
      showLess: "Show less",
    },
    header: {
      controls: {
        edit: "Edit",
      },
      welcome: "Welcome, {{firstName}} {{lastName}}",
      subline: "to your MINTvernetzt Community!",
      cta: "View my profile",
    },
    cropper: {
      avatar: {
        headline: "Profilbild ändern",
      },
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
          headline: "New feature",
          description: "Find suitable funding with our new funding search",
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
      headline_one: "You have {{count}} open invitation from an organization.",
      headline_other: "You have {{count}} open invitations from organizations.",
      description:
        "When you confirm invitations, you become visible as a <0>team member/admin</0> of the organization.",
      linkDescription: "To my organizations",
    },
    requests: {
      headline_one: "Your organization has {{count}} open membership request.",
      headline_other:
        "Your organization has {{count}} open membership requests.",
      description:
        "When you confirm requests, people become visible as <0>team members/admins</0> of your organization.",
      linkDescription: "To my organizations",
    },
    networkInvites: {
      headline_one: "Your organization has {{count}} open network invitation.",
      headline_other:
        "Your organization has {{count}} open network invitations.",
      description:
        "When you confirm invitations, your organization becomes visible as a <0>network member</0>.",
      linkDescription: "To my organizations",
    },
    networkRequests: {
      headline_one:
        "Your network has {{count}} open network membership request from an organization.",
      headline_other:
        "Your network has {{count}} open network membership requests from organizations.",
      description:
        "When you confirm requests, organizations become visible as <0>network members</0>.",
      linkDescription: "To my organizations",
    },
  },
} as const;
