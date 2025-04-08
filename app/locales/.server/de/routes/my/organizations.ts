export const locale = {
  error: {
    notFound: "Organisation oder Profile nicht gefunden",
    alreadyMember: "Du bist bereits Mitglied der Organisation",
    requestFailed: "Anfrage konnte nicht gesendet werden",
    cancelRequestFailed: "Anfrage konnte nicht zurückgezogen werden",
  },
  headline: "Meine Organisationen",
  cta: "Organisation anlegen",
  networkInfo: {
    headline: "Information zur Organisationform “Netzwerk”",
    sublineOne:
      "Bist Du Koordinator:in oder Teammitglied eines MINT-Clusters, einer MINT-Region oder eines anderen Netzwerks?",
    sublineTwo:
      "Lies Dir folgende Schritte durch um Deine Organisation als <0>Netzwerk-Organisation</0> anzulegen.",
    steps: {
      headline: "Lege in 3 Schritten Dein Netzwerk richtig an:",
      checkExisting: {
        headline:
          "Prüfe, ob Deine Netzwerk-Organisation bereits angelegt ist. Falls ja, füge Dich als Teammitglied hinzu.",
        description:
          "Gehe dafür auf <0>“Mich zu einer Organisation hinzufügen”</0>. Hier kannst Du nach Deiner Organisation bzw. Deinem Netzwerk auf der Plattform <0>suchen und Dich hinzufügen.</0> Falls Deine Netzwerk-Organisation noch nicht angelegt ist, kannst Du dies im folgenden Schritt tun.",
      },
      createNetwork: {
        headline: "Lege Dein Netzwerk als Organisation an.",
        descriptionOne:
          "Lege Dein Netzwerk mit Hilfe des Buttons <0>“Organisation anlegen”</0> an. Im darauf folgenden Schritt kannst Du als <0>Organisationsform “Netzwerk”</0> und weitere zutreffende Organisationsformen auswählen.",
        descriptionTwo:
          "Dein Netzwerk nun so angelegt, dass andere Organisationen bei Euch den Beitritt anfragen können oder Ihr andere Organisationen als Netzwerkmitglieder einladen könnt.",
      },
      addInformation: {
        headline:
          "Jetzt kannst Du Deine Netzwerk-Organisation weiter mit Informationen füllen.",
        description:
          "Klicke dafür auf den Button <0>“Bearbeiten”</0> und befülle das Formular mit relevanten Informationen, damit sich die Community gut über Dein Netzwerk informieren kann.",
      },
    },
    more: "Infos ausklappen",
    less: "Infos einklappen",
  },
  requestOrganizationMembership: {
    headline: "Mich zu einer Organisation hinzufügen",
    subline:
      "Suche Organisationen, füge Dich als Teammitglied hinzu oder lege eine Organisation an.",
    create: "Neue Organisation anlegen",
    toasts: {
      organizationsFound:
        "Es existieren bereits Organisationen mit diesem Namen. Frage an, ob Du einer Organisation beitreten kannst.",
    },
    createOrganizationMemberRequestCta: "Beitritt anfragen",
    cancelOrganizationMemberRequestCta: "Beitrittsanfrage zurückziehen",
    createOrganizationMemberRequest:
      "Du hast den Beitritt bei der Organisation {{name}} angefragt. Du wirst benachrichtigt, sobald sich ein Admin zu Deiner Anfrage äußert.",
    cancelOrganizationMemberRequest:
      "Du hast die Beitrittsanfrage zur Organisation {{name}} zurückgezogen.",
    label: "Organisationsname",
    placeholder: "Organisation suchen...",
    helperText: "Mindestens 3 Buchstaben.",
    searchCta: "Suchen",
    alreadyAdmin: "bereits Administrator:in",
    alreadyMember: "bereits Teammitglied",
    alreadyRequested: "bereits angefragt",
    email: {
      subject: {
        requested: "Deine Organisation hat eine Mitgliedsanfrage erhalten.",
        canceled:
          "Eine Mitgliedsanfrage an Deine Organisation wurde zurückgezogen.",
      },
      button: {
        text: "Zur Community Plattform",
      },
    },
  },
  organizationMemberInvites: {
    headline: "Einladungen von Organisationen",
    subline:
      "Wenn Du Einladungen annimmst, wirst Du Teammitglied bzw. Admin der Organisation.",
    tabbar: {
      teamMember: "Teammitglied",
      admin: "Admin",
    },
    decline: "Einladung ablehnen",
    accept: "Einladung annehmen",
    adminAccepted:
      "Du bist erfolgreich der Organisation {{name}} als Administrator:in beigetreten.",
    memberAccepted:
      "Du bist erfolgreich der Organisation {{name}} als Teammitglied beigetreten.",
    rejected: "Du hast den Beitritt zur Organisation {{name}} abgelehnt.",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  networkInvites: {
    headline: "Einladungen Deiner Organisationen zu Netzwerken",
    subline:
      "Wenn Du Einladungen bestätigst, wird Deine Organisation als Netzwerkmitglied sichtbar.",
    decline: "Einladung ablehnen",
    accept: "Einladung annehmen",
    rejectNetworkInvite:
      "Du hast die Einladung von {{organizationName}} abgelehnt.",
    acceptNetworkInvite:
      "Deine Organisation {{organizationName}} wurde zum Netzwerk {{networkName}} hinzugefügt.",
  },
  organizationMemberRequests: {
    headline: "Beitrittsanfragen an Deine Organisationen",
    subline:
      "Wenn Du Anfragen bestätigst, werden Personen als Teammitglied sichtbar.",
    decline: "Beitritt ablehnen",
    accept: "Beitritt annehmen",
    rejectOrganizationMemberRequest:
      "Du hast die Beitrittsanfrage von {{academicTitle}} {{firstName}} {{lastName}} abgelehnt.",
    acceptOrganizationMemberRequest:
      "{{academicTitle}} {{firstName}} {{lastName}} wurde zu Deiner Organisation hinzugefügt.",
  },
  networkRequests: {
    headline: "Beitrittsanfragen an Deine Netzwerke",
    subline:
      "Wenn Du Anfragen bestätigst, werden die Organisationen als Netzwerkmitglied sichtbar.",
    decline: "Beitritt ablehnen",
    accept: "Beitritt annehmen",
    rejectNetworkRequest:
      "Du hast die Beitrittsanfrage von {{organizationName}} abgelehnt.",
    acceptNetworkRequest:
      "Die Organisation {{organizationName}} wurde zu Deinem Netzwerk {{networkName}} hinzugefügt.",
  },
  quit: {
    success: "Du hast die Organisation {{name}} erfolgreich verlassen.",
    lastAdmin:
      "Du kannst die Organisation nicht verlassen, da Du der letzte Admin bist. Drücke auf bearbeiten, um einen anderen Admin zu bestimmen oder die Organisation zu löschen.",
  },
  organizations: {
    tabbar: {
      teamMember: "Teammitglied",
      admin: "Admin",
    },
    subline: {
      teamMember: "Diesen Organisationen bist Du als Teammitglied zugeordnet.",
      admin: "Diesen Organisationen bist Du als Administrator:in zugeordnet.",
    },
  },
  email: {
    createRequest: {
      subject: "Deine Organisation hat eine Mitgliedsanfrage erhalten.",
      button: {
        text: "Zur Community Plattform",
      },
    },
    acceptRequest: {
      subject: "Deine Anfrage wurde bestätigt.",
    },
    rejectRequest: {
      subject: "Deine Anfrage wurde abgelehnt.",
    },
    inviteAccepted: {
      subject: "Deine Einladung wurde akzeptiert.",
    },
    inviteAsAdminAccepted: {
      subject: "Deine Einladung wurde akzeptiert.",
    },
    inviteRejected: {
      subject: "Deine Einladung wurde abgelehnt.",
    },
    inviteAsAdminRejected: {
      subject: "Deine Einladung wurde abgelehnt.",
    },
  },
} as const;
