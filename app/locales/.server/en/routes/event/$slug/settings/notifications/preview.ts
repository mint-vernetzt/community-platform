export const locale = {
  system: {
    footer: {
      html: 'You are receiving this email because you registered for the event <b>{{event.name}}</b> on the MINTvernetzt community platform. If you no longer wish to receive emails, please unsubscribe from <a href="{{profile.revocationLink}}" style="font-weight: bold; text-decoration: underline">this event</a>. Does this email appear to you as spam? Then <a href="{{event.reportUrl}}" style="font-weight: bold; text-decoration: underline">report this event</a>.',
      plainText:
        "You are receiving this email because you registered for the event {{event.name}} on the MINTvernetzt community platform. If you no longer wish to receive emails, please unsubscribe from this event: {{profile.revocationLink}}. Does this email appear to you as spam? Then report this event: {{event.reportUrl}}.",
    },
    timezone: "CET",
  },
} as const;
