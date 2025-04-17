export const locale = {
  error: {
    notFound: "Datenbankeintrag nicht gefunden",
    alreadyMember: "Du bist bereits Mitglied der Organisation",
    requestFailed: "Anfrage konnte nicht gesendet werden",
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
            canceled:
              "Eine Mitgliedsanfrage an Deine Organisation wurde zurückgezogen.",
          },
          button: {
            text: "Zur Community Plattform",
          },
        },
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
} as const;
