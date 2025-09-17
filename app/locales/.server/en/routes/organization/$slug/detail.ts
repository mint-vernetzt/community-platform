export const locale = {
  error: {
    organizationNotFound: "Organization not found",
    onStoring:
      "The image could not be saved. Please try again or contact support.",
    invalidAction: "Invalid action",
  },
  back: "Explore organizations",
  header: {
    image: {
      alt: "Background image of the organization",
    },
    controls: {
      edit: "Edit",
      background: "Change image",
      backgroundLong: "Change background",
      backgroundEdit: "Edit background",
      logo: "Change logo",
    },
  },
  cropper: {
    background: {
      headline: "Background image",
    },
    logo: {
      headline: "Logo",
    },
  },
  tabbar: {
    about: "Info",
    network: "Network",
    team: "Team",
    events: "Events",
    projects: "Projects",
  },
  abuseReport: {
    email: {
      subject: 'Profile "{{username}}" reported organization "{{slug}}"',
    },
  },
  claimRequest: {
    alreadyRequested: {
      description:
        "You have requested to take over this organization profile. We are reviewing your request and will get back to you via email.",
      cta: "Withdraw request",
    },
    notRequested: {
      description:
        "This organization profile was created by MINTvernetzt. If you are part of this organization, you can <0>take over this profile</0>. After our review, you will become an administrator. You can also <0>request a deletion</0>. More information can be found in the <1>help section</1>.",
      cta: "Take over",
    },
    anon: {
      cta: "Log in to take over",
    },
  },
} as const;
