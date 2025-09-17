export const locale = {
  error: {
    organizationNotFound: "Organisation nicht gefunden",
    onStoring:
      "Das Bild konnte nicht gespeichert werden. Bitte versuche es erneut oder wende Dich an den Support.",
    invalidAction: "Invalid action",
    notShadow: "Organization cannot be claimed",
    alreadyClaimed:
      "Die Übernahme der Organisation wurde bereits angefragt oder von uns geprüft",
    alreadyWithdrawn:
      "Die Übernahme der Organisation wurde bereits zurückgezogen oder von uns geprüft",
  },
  back: "Organisationen entdecken",
  header: {
    image: {
      alt: "Hintergrundbild der Organisation",
    },
    controls: {
      edit: "Bearbeiten",
      background: "Bild ändern",
      backgroundLong: "Hintergrundbild ändern",
      backgroundEdit: "Hintergrundbild bearbeiten",
      logo: "Logo ändern",
    },
  },
  cropper: {
    background: {
      headline: "Hintergrundbild",
    },
    logo: {
      headline: "Logo",
    },
  },
  tabbar: {
    about: "Info",
    network: "Netzwerk",
    team: "Team",
    events: "Events",
    projects: "Projekte",
  },
  abuseReport: {
    email: {
      subject:
        'Das Profil "{{username}}" hat die Organisation "{{slug}}" gemeldet',
    },
  },
  claimRequest: {
    alreadyRequested: {
      description:
        "Du hast angefragt, dieses Organisationsprofil zu übernehmen. Wir prüfen Deine Anfrage und melden uns per E-Mail bei Dir.",
      cta: "Anfrage zurückziehen",
      success: "Anfrage zurückgezogen",
    },
    notRequested: {
      description:
        "Dieses Organisationsprofil hat MINTvernetzt angelegt. Wenn Du Teil dieser Organisation bist, kannst Du dieses <0>Profil übernehmen</0>. Nach unserer Prüfung wirst Du Administrator:in. Du kannst auch eine <0>Löschung beantragen</0>. Mehr Infos findest Du im <1>Hilfebereich</1>.",
      cta: "Übernehmen",
      success: "Anfrage erfolgreich versendet",
    },
    anon: {
      cta: "Anmelden zum Übernehmen",
    },
  },
} as const;
