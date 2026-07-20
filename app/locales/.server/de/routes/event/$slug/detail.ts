export const locale = {
  content: {
    back: "Events entdecken",
    jointEvent: "Gemeinsames Event",
    external: "Registrierung über externen Link",
    registrationClosed: {
      label: "Geschlossene Veranstaltung",
      subline: "Teilnahme nur für geladene Gäste",
    },
    registrationOnChildEvents: "Registrierung über die Unterveranstaltungen",
    parentParticipationRequired:
      "Melde Dich zuerst an der Rahmenveranstaltung an",
    unlimitedSeats: "Unbegrenzte Plätze",
    seatsFree: "Plätze frei",
    waitingListAvailable: "Wartelistenplätze verfügbar",
    copy: "URL kopieren",
    copied: "URL kopiert!",
    onSite: "Vor Ort",
    online: "Online Event",
    hybrid: "Hybrides Event",
    details: "Veranstaltungsdetails",
    participants: "Teilnehmer:innen",
    childEvents: "Zugehörige Veranstaltungen",
    inPast: "Event hat bereits stattgefunden",
    beforeParticipationPeriod:
      "Anmeldefrist beginnt am {{date}} um {{time}} Uhr (MEZ)",
    afterParticipationPeriod: "Anmeldefrist abgelaufen",
    draft: "Entwurf",
    canceled: "Event abgesagt",
    edit: "Event bearbeiten",
    externalParticipate: "Link zur Anmeldung",
    login: "Teilnehmen",
    participate: "Teilnehmen",
    anonModal: {
      or: "oder",
      loginOrRegister: {
        title: "Melde Dich zunächst auf der Plattform an.",
        login: "Anmelden mit Zugangsdaten",
        keycloak: "Anmelden mit MINT-ID",
        noMember: "Noch kein Mitglied?",
        registerByEmail: "Registrieren mit E-Mail",
        useKeycloak: "MINT-ID erstellen",
      },
      guestAccess: {
        new: "Neu",
        title: "Ohne Profilerstellung am Event teilnehmen",
        description:
          'Melde Dich mit Deiner E-Mail-Adresse an. Du erhältst alle wichtigen Informationen zum Event per E-Mail. Ohne Profil kannst Du nicht von der Community gefunden werden. Mehr Infos findest Du in unserem <a href="/help#events-reportEvent" target="_blank" class="font-bold hover:underline">Hilfebereich</a>.',
        form: {
          title: {
            label: "Titel",
            options: {
              none: "Kein Titel",
              dr: "Dr.",
              prof: "Prof.",
              profdr: "Prof. Dr.",
            },
          },
          firstName: "Vorname *",
          lastName: "Nachname *",
          organizationName: "Organisation",
          email: "E-Mail *",
          submit: "Zum Event anmelden",
          cancel: "Abbrechen",
          validation: {
            firstName: "Bitte gib Deinen Vornamen ein.",
            lastName: "Bitte gib Deinen Nachnamen ein.",
            email: "Bitte gib eine gültige E-Mail-Adresse ein.",
          },
        },
      },
    },
    withdrawParticipation: {
      cta: "Nicht mehr teilnehmen",
      confirmationModal: {
        title: "Möchtest Du Deine Teilnahme wirklich zurückziehen?",
        description: {
          closedForRegistration:
            "Es handelt sich um eine geschlossene Veranstaltung. Du müsstest erneut eingeladen werden, um wieder teilnehmen zu können.",
          afterParticipationPeriod:
            "Die Anmeldefrist für diese Veranstaltung ist abgelaufen. Du kannst dann nicht mehr teilnehmen.",
          waitingList:
            "Personen auf der Warteliste würden nachrücken, wenn Du Deine Teilnahme zurückziehst. Du kannst dann selbst nur noch auf die Warteliste.",
          childEvents:
            "Durch das Zurückziehen deiner Teilnahme am Rahmenevent werden automatisch auch Deine Teilnahmen und Wartelistenplätze bei folgenden Unterveranstaltungen zurückgezogen:",
        },
        submit: "Teilnahme zurückziehen",
        abort: "Abbrechen",
      },
    },
    joinWaitingList: "Zur Warteliste hinzufügen",
    leaveWaitingList: {
      cta: "Von der Warteliste entfernen",
      confirmationModal: {
        title: "Möchtest Du Dich wirklich von der Warteliste entfernen?",
        description: {
          afterParticipationPeriod:
            "Die Anmeldefrist für diese Veranstaltung ist abgelaufen. Du kannst Dich dann nicht mehr auf die Warteliste setzen.",
        },
        submit: "Von der Warteliste entfernen",
        abort: "Abbrechen",
      },
    },
    report: "Melden",
    reported: "Meldung wird geprüft",
    reportFaq: "Weitere Infos zum Melden",
    changeBackground: "Bild bearbeiten",
    overlayMenu: {
      close: "Schließen",
    },
    contactPerson: "Ansprechpartner:in",
    participateOnEventIntentModal: {
      title: "Möchtest Du an dieser Veranstaltung teilnehmen?",
      description: {
        participate:
          "Du kannst Dich hier direkt für die Veranstaltung anmelden.",
        joinWaitingList:
          "Leider sind alle Plätze belegt. Du kannst Dich aber hier direkt auf die Warteliste für die Veranstaltung setzen.",
      },
      submit: {
        participate: "Teilnehmen",
        joinWaitingList: "Auf Warteliste setzen",
      },
      cancel: "Abbrechen",
    },
  },
  errors: {
    invalidProfileId: "Ungültige Profil-ID",
    participate: "Fehler beim Hinzufügen zu Teilnehmer:innen",
    withdrawParticipation: "Fehler beim Entfernen von Teilnehmer:innen",
    joinWaitingList: "Fehler beim Hinzufügen zur Warteliste",
    leaveWaitingList: "Fehler beim Entfernen von der Warteliste",
    participateAsGuest: "Fehler beim Anmelden ohne Profilerstellung",
    abuseReport: {
      reasons: {
        required: "Bitte gib einen Grund an.",
      },
      submit: "Fehler beim Absenden der Meldung",
    },
    background: {
      upload:
        "Das Bild konnte nicht gespeichert werden. Bitte versuche es erneut oder wende Dich an den Support.",
      disconnect:
        "Das Hintergrundbild konnte nicht entfernt werden. Bitte versuche es erneut oder wende Dich an den Support.",
    },
  },
  success: {
    participate: "Erfolgreich als Teilnehmer:in angemeldet",
    withdrawParticipation: "Erfolgreich von Teilnehmer:innen entfernt",
    joinWaitingList: "Erfolgreich zur Warteliste hinzugefügt",
    leaveWaitingList: "Erfolgreich von der Warteliste entfernt",
    abuseReport: "Die Meldung des Events wurde verschickt.",
    participateAsGuest:
      "Anmeldung ohne Profilerstellung erfolgreich. Überprüfe Deine E-Mails, um die Registrierung abzuschließen.",
  },
  abuseReport: {
    title: "Warum möchstest Du dieses Event melden?",
    description:
      "Um Deiner Meldung nachgehen zu  können, benötigen wir den Grund, warum Du dieses Event melden möchtest.",
    faq: `Weitere Infos zum Meldenprozess findest Du in unserem <a href="/help#registration" target="_blank" class="font-bold hover:underline">Hilfebereich</a>.`,
    otherReason: "Anderer Grund",
    maxLength: "Maximal {{max}} Zeichen",
    noReasons: "Bitte gib mindestens einen Grund an.",
    alreadySubmitted: "Du hast dieses Event bereits gemeldet.",
    submit: "Event melden",
    abort: "Abbrechen",
    email: {
      subject: 'Das Profil "{{username}}" hat das Event "{{slug}}" gemeldet',
    },
  },
  changeBackground: {
    title: "Hintergrundbild ändern",
    alt: "Hintergrundbild für das Event {{eventName}}",
    upload: {
      validation: {
        image: {
          size: "Die Bilddatei ist zu groß. Maximal erlaubte Größe ist {{maxSize}} MB.",
          type: "Die Bilddatei hat ein ungültiges Format. Erlaubte Formate sind: {{allowedFormats}}.",
        },
      },
      selection: {
        select: "Bild auswählen",
        empty: "Kein Bild ausgewählt",
      },
    },
    imageCropper: {
      imageCropper: {
        error: "Fehler beim Zuschneiden des Bildes",
        confirmation: "Bild erfolgreich zugeschnitten",
        disconnect: "Verbindung zum Bildbearbeitungsdienst getrennt",
        reset: "Zurücksetzen",
        submit: "Bild zuschneiden",
      },
    },
    success: {
      imageAdded: "{{imageType}} hinzugefügt",
      imageRemoved: "{{imageType}} entfernt",
      imageTypes: {
        background: "Hintergrundbild",
        avatar: "Profilbild",
        logo: "Logo",
      },
    },
  },
  mail: {
    moveFromWaitingListToParticipants: {
      subject:
        "Du wurdest von der Warteliste zu den Teilnehmenden eines Events hinzugefügt",
    },
    profileAlreadyExists: {
      subject:
        "Deine E-Mail-Adresse wurde benutzt, um sich als Gast an einem Event anzumelden.",
    },
    confirmRegistration: {
      subject: "Bitte bestätige Deine Anmeldung für das Event",
    },
  },
} as const;
