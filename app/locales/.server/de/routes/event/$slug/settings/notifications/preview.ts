export const locale = {
  system: {
    mails: {
      oneDayBefore: {
        title: "Erinnert Deine Teilnehmenden einen Tag vorher",
        subject: "Erinnerung: Das Event {{eventName}} findet morgen statt",
        html: 'Hallo {{profile.firstName}},<br><br>das Event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> findet morgen statt.<br><br>Termin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})<br>{{#if event.location}}Ort: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Konferenz-Link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>Wir freuen uns sehr, dass Du dabei bist!<br><br>{{#if profile.isGuest}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte Deine Teilnahme über den <a href="{{event.revocationLink}}" style="text-decoration: underline;">Abmeldelink</a> zurück, so dass andere nachrücken können.<br><br>{{else}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte auf der Community-Plattform Deine Teilnahme zurück, so dass andere nachrücken können.<br><br>{{/if}}Bis bald und herzliche Grüße<br>Dein MINTvernetzt-Team',
        plainText:
          "{{headline}}\n\nHallo {{profile.firstName}},\n\ndas Event {{event.name}} findet morgen statt.\n\nLink zum Event: {{event.url}}\nTermin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})\n{{#if event.location}}Ort: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Konferenz-Link: {{event.conferenceLink}}\n{{/if}}\n{{/if}}Wir freuen uns sehr, dass Du dabei bist!\n\n{{#if profile.isGuest}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte Deine Teilnahme über den Abmeldelink zurück, so dass andere nachrücken können.\nAbmeldelink: {{event.revocationLink}}\n{{else}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte auf der Community-Plattform Deine Teilnahme zurück, so dass andere nachrücken können.\n{{/if}}\nBis bald und herzliche Grüße\nDein MINTvernetzt-Team",
      },
      oneHourBefore: {
        title: "Erinnert Deine Teilnehmenden eine Stunde vorher",
        subject: "Erinnerung: Das Event {{event.name}} findet bald statt",
        html: 'Hallo {{profile.firstName}},<br><br>das Event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> findet bald statt.<br><br>Termin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})<br>{{#if event.location}}Ort: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Konferenz-Link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>Wir freuen uns sehr, dass Du dabei bist!<br><br>{{#if profile.isGuest}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte Deine Teilnahme über den <a href="{{event.revocationLink}}" style="text-decoration: underline;">Abmeldelink</a> zurück, so dass andere nachrücken können.<br><br>{{else}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte auf der Community-Plattform Deine Teilnahme zurück, so dass andere nachrücken können.<br><br>{{/if}}Bis gleich<br>Dein MINTvernetzt-Team',
        plainText:
          "{{headline}}\n\nHallo {{profile.firstName}},\n\ndas Event {{event.name}} findet bald statt.\n\nLink zum Event: {{event.url}}\nTermin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})\n{{#if event.location}}Ort: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Konferenz-Link: {{event.conferenceLink}}\n{{/if}}\n\nWir freuen uns sehr, dass Du dabei bist!\n\n{{#if profile.isGuest}}Wenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte Deine Teilnahme über den Abmeldelink zurück, so dass andere nachrücken können.\n\nAbmeldelink: {{event.revocationLink}}\n{{else}}\nWenn sich bei Dir etwas ändert und Du doch nicht teilnehmen kannst, dann ziehe bitte auf der Community-Plattform Deine Teilnahme zurück, so dass andere nachrücken können.\n{{/if}}\n\nBis gleich\nDein MINTvernetzt-Team",
      },
      fifteenMinutesBefore: {
        title: "Letzter Hinweis kurz vor Start",
        subject: "Erinnerung: Das Event {{event.name}} findet gleich statt",
        html: 'Hallo {{profile.firstName}},<br><br>das Event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> findet gleich statt.<br><br>Termin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})<br>{{#if event.location}}Ort: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Konferenz-Link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>Wir freuen uns sehr, dass Du dabei bist!<br><br>Bis gleich<br>Dein MINTvernetzt-Team',
        plainText:
          "{{headline}}\n\nHallo {{profile.firstName}},\n\ndas Event {{event.name}} findet bald statt.\n\nLink zum Event: {{event.url}}\nTermin: {{event.startDate}}, {{event.startTime}} Uhr ({{event.timezone}})\n{{#if event.location}}Ort: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Konferenz-Link: {{event.conferenceLink}}\n{{/if}}\n\nWir freuen uns sehr, dass Du dabei bist!\n\nBis gleich\nDein MINTvernetzt-Team",
      },
    },
    footer: {
      html: 'Du erhältst diese E-Mail, weil Du Dich auf der MINTvernetzt Community-Plattform für das Event <b>{{event.name}}</b> angemeldet hast. Wenn Du keine E-Mails mehr erhalten möchtest, dann melde Dich von <a href="{{profile.revocationLink}}" style="font-weight: bold; text-decoration: underline">diesem Event ab</a>. Diese E-Mail erscheint Dir als Spam? Dann <a href="{{event.reportUrl}}" style="font-weight: bold; text-decoration: underline">melde dieses Event</a>.',
      plainText:
        "Du erhältst diese E-Mail, weil Du Dich auf der MINTvernetzt Community-Plattform für das Event {{event.name}} angemeldet hast. Wenn Du keine E-Mails mehr erhalten möchtest, dann melde Dich von diesem Event ab: {{profile.revocationLink}}. Diese E-Mail erscheint Dir als Spam? Dann melde dieses Event: {{event.reportUrl}}",
    },
    timezone: "MEZ",
  },
} as const;
