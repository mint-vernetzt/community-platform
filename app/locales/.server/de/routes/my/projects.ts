export const locale = {
  error: {
    notFound: "Datenbankeintrag nicht gefunden",
    lastAdmin:
      "Du kannst das Projekt nicht verlassen, da Du der letzte Admin bist. Drücke auf bearbeiten, um einen anderen Admin zu bestimmen oder das Projekt zu löschen.",
    lastTeamMember:
      "Du kannst das Projekt nicht verlassen, da Du das letzte Teammitglied bist. Wende dich an die Admins, um ein anderes Teammitglied zu bestimmen oder das Projekt zu löschen.",
  },
  title: "Meine Projekte",
  create: "Projekt anlegen",
  placeholder: {
    title: "Du hast bislang keine eigenen Projekte erstellt.",
    description: "Teile Dein Wissen, um die Community zu inspirieren!",
    cta: "Jetzt Projekt anlegen",
  },
  tabBar: {
    adminProjects: "Admin",
    teamMemberProjects: "Teammitglied",
  },
  quit: {
    modal: {
      adminProjects: {
        headline: "Nicht mehr Admin sein",
        subline:
          "Bist Du Dir sicher, dass du die nicht mehr Administrator:in des Projekts {{name}} sein möchtest?",
        cta: "Projekt verlassen",
      },
      teamMemberProjects: {
        headline: "Nicht mehr Teammitglied sein",
        subline:
          "Bist Du Dir sicher, dass du nicht mehr Teammitglied des Projekts {{name}} sein möchtest?",
        cta: "Projekt verlassen",
      },
      cancelCta: "Abbrechen",
    },
    successAdmin:
      "Du bist jetzt nicht mehr Administrator:in des Projekts {{name}}.",
    successMember:
      "Du bist jetzt nicht mehr Teammitglied des Projekts {{name}}.",
  },
} as const;
