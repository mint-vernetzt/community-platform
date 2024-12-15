export const locale = {
  validation: {
    organizationName: {
      required: "Bitte gib den Namen Deiner Organisation ein.",
      min: "Bitte gib den Namen Deiner Organisation ein.Der Name der Organisation muss mindestens 3 Zeichen lang sein.",
    },
  },
  content: {
    back: "Zurück",
    headline: "Organisation oder Netzwerk hinzufügen",
  },
  form: {
    organizationName: {
      label: "Name der Organisation*",
    },
    submit: {
      label: "Anlegen",
    },
    error: {
      sameOrganization:
        'Es wurden Organisationen mit ähnlichem Namen gefunden. Falls Du die Organisation mit Namen "{{searchQuery}}" anlegen willst, klicke erneut auf "Anlegen".',
    },
  },
} as const;
