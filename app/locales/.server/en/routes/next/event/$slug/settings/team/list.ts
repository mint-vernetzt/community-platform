import { remove } from "jszip";

export const locale = {
  title: "Current Team",
  explanation:
    "<0>Please note</0>: There must be <0>at least one team member</0>.",
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    searchPlaceholder: "Search for team members...",
    remove: "Remove as team member",
    removeContactPerson: "Remove as contact person",
    addContactPerson: "Add as contact person",
  },
  confirmation: {
    title: "Do you really want to remove yourself as a team member?",
    description:
      "If you remove yourself as a team member, you will no longer have access to edit your event.",
    confirm: "Remove as team member",
    abort: "Cancel",
  },
  errors: {
    removeLastTeamMember:
      "You cannot remove the last team member of the event.",
    removeTeamMemberFailed: "Removing the team member has failed.",
    addContactPersonFailed: "Adding the contact person has failed.",
    removeContactPersonFailed: "Removing the contact person has failed.",
  },
  success: {
    removeTeamMember: "The team member has been successfully removed.",
    addContactPerson: "The contact person has been successfully added.",
    removeContactPerson: "The contact person has been successfully removed.",
  },
  mail: {
    removeTeamMemberSubject:
      "Du wurdest als Teammitglied eines Events entfernt",
    removeContactPersonSubject:
      "Du wurdest als Ansprechpartner:in eines Events entfernt",
    addContactPersonSubject:
      "Du wurdest als Ansprechpartner:in eines Events hinzugefügt",
  },
} as const;
