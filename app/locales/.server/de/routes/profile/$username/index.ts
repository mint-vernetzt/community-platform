export const locale = {
  back: "Personen entdecken",
  error: {
    profileNotFound: "Profile not found",
    onStoring:
      "Das Bild konnte nicht gespeichert werden. Bitte versuche es erneut oder wende Dich an den Support.",
    invalidAction: "Invalid action",
  },
  profile: {
    contact: "Kontakt",
    changeAvatar: "Avatar ändern",
    changeBackground: "Hintergrund ändern",
    changeBackgroundHeadline: "Hintergrundbild",
    changeAvatarHeadline: "Profilbild",
    existsSince: "Profil besteht seit dem {{timestamp}}",
    introduction: "Hi, ich bin {{name}}",
    editProfile: "Profil bearbeiten",
    activityAreas: "Aktivitätsgebiete",
    competences: "Kompetenzen",
    interests: "Interessen",
    offer: "Ich biete",
    lookingFor: "Ich suche",
  },
  images: {
    currentBackground: "Aktuelles Hintergrundbild",
  },
  section: {
    organizations: {
      title: "Organisationen",
      create: "Organisation anlegen",
    },
    projects: {
      title: "Projekte",
      create: "Projekt anlegen",
      to: "Zum Projekt",
    },
    comingEvents: {
      title: "Bevorstehende Events",
      create: "Event anlegen",
    },
    pastEvents: {
      title: "Vergangene Events",
    },
    event: {
      admin: "Administrator:in",
      team: "Team",
      speaker: "Speaker:in",
      participation: "Teilnahme",
      published: "Veröffentlicht",
      draft: "Entwurf",
      cancelled: "Wurde abgesagt",
      registered: "Angemeldet",
      waiting: "Wartend",
      participated: "Teilgenommen",
      more: "Mehr erfahren",
      wasCancelled: "Wurde abgesagt",
      unlimitedSeats: "Unbegrenzte Plätze",
      seatsFree: "Plätzen frei",
      onWaitingList: "auf der Warteliste",
    },
  },
  abuseReport: {
    email: {
      subject:
        'Das Profil "{{reporterUsername}}" hat das Profil "{{reportedUsername}}" gemeldet',
    },
  },
} as const;
