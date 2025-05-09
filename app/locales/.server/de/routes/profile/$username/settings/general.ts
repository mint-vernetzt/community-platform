export const locale = {
  error: {
    profileNotFound: "Profile not found.",
    validationFailed: "Validation failed",
    serverError: "Something went wrong on update.",
    notPrivileged: "Not privileged",
    noVisibilities: "profile visbilities not found.",
  },
  validation: {
    firstName: {
      required: "Bitte gib Deinen Vornamen ein.",
    },
    lastName: {
      required: "Bitte gib Deinen Nachnamen ein.",
    },
  },
  headline: "Persönliche Daten",
  general: {
    headline: "Allgemein",
    intro:
      "Welche Informationen möchtest Du über Dich mit der Community teilen? Über das Augen-Symbol kannst Du auswählen, ob die Informationen für alle öffentlich sichtbar sind oder ob Du sie nur mit registrierten Nutzer:innen teilst.",
    form: {
      title: {
        label: "Titel",
        options: {
          dr: "Dr.",
          prof: "Prof.",
          profdr: "Prof. Dr.",
        },
      },
      position: {
        label: "Position",
      },
      firstName: {
        label: "Vorname",
      },
      lastName: {
        label: "Nachname",
      },
      email: {
        label: "E-Mail",
        helperText:
          "Ändern der primären E-Mail unter <0>Login & Sicherheit</0>.",
      },
      email2: {
        label: "Zusätzliche E-Mail",
      },
      phone: {
        label: "Telefon",
      },
    },
  },
  aboutMe: {
    headline: "Über mich",
    intro:
      "Erzähl der Community etwas über Dich: Wer bist Du und was machst Du konkret im MINT-Bereich? In welchen Regionen bist Du vorrangig aktiv? Welche Kompetenzen bringst Du mit und welche Themen interessieren Dich im MINT-Kontext besonders?",
    form: {
      description: {
        label: "Kurzbeschreibung",
        placeholder: "Beschreibe Dich und Dein Tätigkeitsfeld näher.",
      },
      activityAreas: {
        label: "Aktivitätsgebiete",
        placeholder: "Füge Regionen hinzu, in denen Du aktiv bist.",
      },
      skills: {
        label: "Kompetenzen",
        placeholder: "Füge Deine Kompetenzen hinzu.",
      },
      interests: {
        label: "Interessen",
        placeholder: "Füge Deine Interessen hinzu.",
      },
    },
  },
  offer: {
    headline: "Ich biete",
    intro:
      "Was bringst Du mit, wovon die Community profitieren kann? Wie kannst Du andere Mitglieder unterstützen?",
    form: {
      quote: {
        label: "Angebot",
        placeholder: "Füge Deine Angebote hinzu.",
      },
    },
  },
  lookingFor: {
    headline: "Ich suche",
    intro: "Wonach suchst Du? Wie können Dich andere Mitglieder unterstützen?",
    form: {
      seeking: {
        label: "",
        placeholder: "",
      },
    },
  },
  websiteSocialMedia: {
    headline: "Website und Soziale Netzwerke",
    website: {
      headline: "Website",
      intro: "Wo kann die Community mehr über Dich und Dein Angebot erfahren?",
      form: {
        website: {
          label: "Website",
          placeholder: "domainname.tld",
        },
      },
    },
    socialMedia: {
      headline: "Soziale Netzwerke",
      intro: "Wo kann die Community in Kontakt mit Dir treten?",
    },
  },
  network: {
    headline: "Organisation oder Netzwerk hinzufügen",
    action: "Organisation anlegen",
    intro:
      "Die Organisation oder das Netzwerk, in dem Du tätig bist, hat noch kein Profil? Füge es direkt hinzu, damit auch andere Mitglieder darüber erfahren können.<br /><br />Falls die Organisation bereits existiert, melde dich bei der Person, die diese angelegt hat.<br /><br />Zukünfig wirst Du dich selbstständig zu Organisationen hinzufügen können.",
  },
  footer: {
    profileUpdated: "Dein Profil wurde aktualisiert.",
    ignoreChanges: "Änderungen verwerfen",
    save: "Speichern",
  },
} as const;
