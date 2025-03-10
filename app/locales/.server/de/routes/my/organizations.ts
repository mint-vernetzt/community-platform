export const locale = {
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
  invites: {
    headline: "Einladungen",
    subline:
      "Ein Admin wird benachrichtigt, sobald Du Dich zu der Einladung äußerst.",
    tabbar: {
      teamMember: "Teammitglied",
      admin: "Admin",
    },
    decline: "Ablehnen",
    accept: "Annehmen",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  addOrganization: {
    headline: "Mich zu einer Organisation hinzufügen",
    subline:
      "Suche Organisationen, füge Dich als Teammitglied hinzu oder lege eine Organisation an.",
    create: "Neue Organisation anlegen",
    toasts: {
      organizationsFound:
        "Es existieren bereits Organisationen mit diesem Namen. Frage an, ob Du einer Organisation beitreten kannst.",
    },
    createRequest: "Beitritt anfragen",
    cancelRequest: "Beitrittsanfrage zurückziehen",
    errors: {
      invalidRoute: "Keine gültige Route",
      alreadyInRelation:
        "Du hast schon angefragt, dieses Profil dieser Organisation hinzuzufügen, hast eine Einladung erhalten oder bist bereits Mitglied.",
      custom:
        "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
    },
    placeholder: "Organisation suchen...",
    helperText: "Mindestens 3 Buchstaben.",
  },
  requests: {
    headline: "Beitrittsanfragen",
    subline: "Du hast {{count}} neue Beitrittsanfragen.",
    singleCountSubline: "Du hast 1 neue Beitrittsanfrage.",
    decline: "Ablehnen",
    accept: "Hinzufügen",
    createRequest:
      "Du hast den Beitritt bei der Organisation {{organization.name}} angefragt. Du wirst benachrichtigt, sobald sich ein Admin zu Deiner Anfrage äußert.",
    cancelRequest:
      "Du hast die Beitrittsanfrage zur Organisation {{organization.name}} zurückgezogen.",
    rejectRequest:
      "Du hast die Beitrittsanfrage von {{academicTitle}} {{firstName}} {{lastName}} abgelehnt.",
    acceptRequest:
      "{{academicTitle}} {{firstName}} {{lastName}} wurde zu Deiner Organisation hinzugefügt.",
  },
  quit: {
    success: "Du hast die Organisation {{organization}} erfolgreich verlassen.",
    lastAdmin:
      "Du kannst die Organisation nicht verlassen, da Du der letzte Admin bist. Drücke auf bearbeiten, um einen anderen Admin zu bestimmen oder die Organisation zu löschen.",
  },
  organizations: {
    tabbar: {
      teamMember: "Teammitglied",
      admin: "Admin",
    },
  },
  alerts: {
    accepted:
      "Du bist erfolgreich der Organisation {{organization}} beigetreten.",
    rejected:
      "Du hast den Beitritt zur Organisation {{organization}} abgelehnt.",
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
