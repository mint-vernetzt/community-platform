export const locale = {
  system: {
    footer: {
      html: 'Du erhältst diese E-Mail, weil Du Dich auf der MINTvernetzt Community-Plattform für das Event <b>{{event.name}}</b> angemeldet hast. Wenn Du keine E-Mails mehr erhalten möchtest, dann melde Dich von <a href="{{profile.revocationLink}}" style="font-weight: bold; text-decoration: underline">diesem Event ab</a>. Diese E-Mail erscheint Dir als Spam? Dann <a href="{{event.reportUrl}}" style="font-weight: bold; text-decoration: underline">melde dieses Event</a>.',
      plainText:
        "Du erhältst diese E-Mail, weil Du Dich auf der MINTvernetzt Community-Plattform für das Event {{event.name}} angemeldet hast. Wenn Du keine E-Mails mehr erhalten möchtest, dann melde Dich von diesem Event ab: {{profile.revocationLink}}. Diese E-Mail erscheint Dir als Spam? Dann melde dieses Event: {{event.reportUrl}}",
    },
    timezone: "MEZ",
  },
} as const;
