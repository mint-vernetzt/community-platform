export const locale = {
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
      label: "Name der Organisation / des Netzwerks*",
      sameOrganization:
        'Es wurden Organisationen mit ähnlichem Namen gefunden. Falls Du trotzdem die Organisation mit Namen "{{searchQuery}}" anlegen willst, klicke erneut auf "Organisation anlegen".',
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
