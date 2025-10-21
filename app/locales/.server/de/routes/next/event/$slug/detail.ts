import { success } from "node_modules/domain-functions/types/composable/composable";

export const locale = {
  content: {
    back: "Events entdecken",
    jointEvent: "Gemeinsames Event",
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
      "Anmeldefrist beginnt am {{date}} um {{time}} Uhr",
    afterParticipationPeriod: "Anmeldefrist abgelaufen.",
    draft: "Entwurf",
    canceled: "Event abgesagt",
    edit: "Event bearbeiten",
    login: "Anmelden um teilzunehmen",
    participate: "Teilnehmen",
    withdrawParticipation: "Nicht mehr teilnehmen",
    joinWaitingList: "Zur Warteliste hinzufügen",
    leaveWaitingList: "Von der Warteliste entfernen",
    report: "Melden",
    reported: "Meldung wird geprüft",
    reportFaq: "Weitere Infos zum Melden",
  },
  errors: {
    invalidProfileId: "Ungültige Profil-ID",
    participate: "Fehler beim Hinzufügen zu Teilnehmer:innen",
    withdrawParticipation: "Fehler beim Entfernen von Teilnehmer:innen",
    joinWaitingList: "Fehler beim Hinzufügen zur Warteliste",
    leaveWaitingList: "Fehler beim Entfernen von der Warteliste",
    abuseReport: {
      reasons: {
        required: "Bitte gib einen Grund an.",
      },
      submit: "Fehler beim Absenden der Meldung",
    },
  },
  success: {
    participate: "Erfolgreich zu Teilnehmer:innen hinzugefügt",
    withdrawParticipation: "Erfolgreich von Teilnehmer:innen entfernt",
    joinWaitingList: "Erfolgreich zur Warteliste hinzugefügt",
    leaveWaitingList: "Erfolgreich von der Warteliste entfernt",
    abuseReport: "Die Meldung des Events wurde verschickt.",
  },
  abuseReport: {
    title: "Warum möchstest Du dieses Event melden?",
    description:
      "Um Deiner Meldung nachgehen zu  können, benötigen wir den Grund, warum Du dieses Event melden möchtest.",
    faq: `Weitere Infos zum Meldenprozess findest Du in unserem <a href="/help#events-reportEvent" target="_blank" class="text-primary underline hover:no-underline">Hilfebereich</a>.`,
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
} as const;
