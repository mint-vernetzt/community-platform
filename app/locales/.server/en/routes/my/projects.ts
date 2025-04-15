export const locale = {
  error: {
    notFound: "Database entry not found",

    lastAdmin:
      "You cannot leave the project because you are the last admin. Press edit to appoint another admin or delete the project.",
    lastTeamMember:
      "You cannot leave the project because you are the last team member. Contact the admins to appoint another team member or delete the project.",
  },
  title: "My Projects",
  create: "Create project",
  placeholder: {
    title: "You haven't created any projects yet.",
    description: "Share your knowledge to inspire the community!",
    cta: "Create project now",
  },
  tabBar: {
    adminProjects: "Admin",
    teamMemberProjects: "Team Member",
  },
  quit: {
    modal: {
      adminProjects: {
        headline: "Not an admin anymore",
        subline:
          "Are you sure you don't want to be an admin of the project {{name}} anymore?",
        cta: "Leave project",
      },
      teamMemberProjects: {
        headline: "Not a team member anymore",
        subline:
          "Are you sure you don't want to be a team member of the project {{name}} anymore?",
        cta: "Leave project",
      },
      cancelCta: "Cancel",
    },
    successAdmin: "You are no longer an admin of the project {{name}}.",
    successMember: "You are no longer a team member of the project {{name}}.",
  },
} as const;
