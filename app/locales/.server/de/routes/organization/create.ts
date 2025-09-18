export const locale = {
  error: {
    notFound: "Datenbankeintrag nicht gefunden",
    alreadyMember: "Du bist bereits Mitglied der Organisation",
    requestFailed: "Anfrage konnte nicht gesendet werden",
    notShadow: "Organization cannot be claimed",
    alreadyClaimed:
      "Die Übernahme der Organisation wurde bereits angefragt oder von uns geprüft",
    alreadyWithdrawn:
      "Die Übernahme der Organisation wurde bereits zurückgezogen oder von uns geprüft",
  },
  validation: {
    organizationName: {
      required: "Bitte gib den Namen Deiner Organisation ein.",
      min: "Der Name der Organisation muss mindestens {{min}} Zeichen lang sein.",
      max: "Der Name der Organisation darf maximal {{max}} Zeichen lang sein.",
    },
    organizationTypeNetworkNotFound:
      "Organisationsform Netzwerk nicht gefunden",
    notANetwork:
      "Deine Organisation muss die Organisationsform Netzwerk haben um Netzwerkformen hinzuzufügen",
    networkTypesRequired: "Bitte wähle mindestens eine Netzwerkform aus.",
  },
  back: "Meine Organisationen",
  headline: "Organisation anlegen",
  form: {
    organizationName: {
      headline: "Wie heißt Deine Organisation oder Dein Netzwerk?",
      noJsSearchForm: {
        label: "Vorhandene Organisation suchen",
        placeholder: "Name der Organisation oder des Netzwerks",
        searchCta: "Suchen",
      },
      requestOrganizationMembership: {
        createOrganizationMemberRequestCta: "Beitritt anfragen",
        createOrganizationMemberRequest:
          "Du hast den Beitritt bei der Organisation {{name}} angefragt. Du wirst benachrichtigt, sobald sich ein Admin zu Deiner Anfrage äußert.",
        label: "Name der Organisation / des Netzwerks*",
        alreadyMember: "bereits Teammitglied",
        alreadyRequested: "bereits angefragt",
        email: {
          subject: {
            requested: "Deine Organisation hat eine Mitgliedsanfrage erhalten.",
          },
          button: {
            text: "Zur Community Plattform",
          },
        },
      },
      similarOrganizationsFound: {
        singular: "Es wurde {{count}} ähnliche Organisation gefunden.",
        plural: "Es wurden {{count}} ähnliche Organisationen gefunden.",
      },
    },
    organizationTypes: {
      cta: "Bitte auswählen",
      headline: "Um welche Art von Organisation handelt es sich?",
      label: "Organisationsform",
      helperText: "Mehrfachauswahl ist möglich",
      notFound:
        "Die Organisationsform konnte nicht gefunden werden. Bitte kontaktiere den Support.",
    },
    networkTypes: {
      cta: "Bitte auswählen",
      headline: "Um welche Art von Netzwerk handelt es sich?",
      label: "Netzwerkform",
      helper: "Mehrfachauswahl ist möglich",
      helperWithoutNetwork: 'Benötigt Organisationsform "Netzwerk"',
      notFound:
        "Die Netzwerkform konnte nicht gefunden werden. Bitte kontaktiere den Support.",
    },
    helperText: "*Erforderliche Angaben",
    cancel: "Abbrechen",
    submit: "Organisation anlegen",
  },
  successAlert:
    '<p>Du hast Deine Organisation {{name}} erfolgreich angelegt. Du bist Teammitglied und Admin Deiner Organisation. Bearbeite nun Deine Organisation und mache sie damit sichtbarer für die Community. <a href="/organization/{{slug}}/settings" class="hover:mv-underline mv-text-primary">Jetzt bearbeiten</a></p>',
  claimRequest: {
    alreadyRequested: {
      description:
        "Du hast angefragt, dieses Organisationsprofil zu übernehmen. Wir prüfen Deine Anfrage und melden uns per E-Mail bei Dir.",
      cta: "Übernahme zurückziehen",
    },
    notRequested: {
      description:
        "Dieses Organisationsprofil hat MINTvernetzt angelegt. Wenn Du Teil dieser Organisation bist, kannst Du dieses <0>Profil übernehmen</0>. Nach unserer Prüfung wirst Du Administrator:in. Du kannst auch eine <0>Löschung beantragen</0>. Mehr Infos findest Du im <1>Hilfebereich</1>.",
      cta: "Übernehmen",
    },
    created: {
      success: "Anfrage erfolgreich versendet",
    },
    withdrawn: {
      success: "Anfrage zurückgezogen",
    },
  },
} as const;
