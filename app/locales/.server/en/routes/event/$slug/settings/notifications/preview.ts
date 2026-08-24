export const locale = {
  system: {
    mails: {
      oneDayBefore: {
        title: "Reminds your participants one day before",
        subject: "Reminder: The event {{event.name}} takes place tomorrow",
        html: 'Hello {{profile.firstName}},<br><br>the event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> takes place tomorrow.<br><br>Date: {{event.startDate}}, {{event.startTime}} ({{event.timezone}})<br>{{#if event.location}}Location: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Conference link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>We are very pleased that you will be attending!<br><br>{{#if profile.isGuest}}If something changes and you cannot attend after all, please withdraw your participation via the <a href="{{event.revocationLink}}" style="text-decoration: underline;">revocation link</a>, so that others can move up.<br><br>{{else}}If something changes and you cannot attend after all, please withdraw your participation on the community platform, so that others can move up.<br><br>{{/if}}See you soon and best regards<br>Your MINTvernetzt team',
        plainText:
          "{{headline}}\n\nHello {{profile.firstName}},\n\nthe event {{event.name}} takes place tomorrow.\n\nEvent link: {{event.url}}\nDate: {{event.startDate}}, {{event.startTime}} ({{event.timezone}})\n{{#if event.location}}Location: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Conference link: {{event.conferenceLink}}\n{{/if}}\nWe are very pleased that you will be attending!{{#if profile.isGuest}}If something changes and you cannot attend after all, please withdraw your participation via the revocation link: {{event.revocationLink}}, so that others can move up.\n\n{{else}}If something changes and you cannot attend after all, please withdraw your participation on the community platform, so that others can move up.{{/if}}\n\nSee you soon and best regards\nYour MINTvernetzt team",
      },
      oneHourBefore: {
        title: "Reminds your participants one hour before",
        subject: "Reminder: The event {{event.name}} takes place soon",
        html: 'Hello {{profile.firstName}},<br><br>the event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> takes place soon.<br><br>Date: {{event.startDate}}, {{event.startTime}} ({{event.timezone}})<br>{{#if event.location}}Location: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Conference link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>We are very pleased that you will be attending!<br><br>{{#if profile.isGuest}}If something changes and you cannot attend after all, please withdraw your participation via the <a href="{{event.revocationLink}}" style="text-decoration: underline;">revocation link</a>, so that others can move up.<br><br>{{else}}If something changes and you cannot attend after all, please withdraw your participation on the community platform, so that others can move up.<br><br>{{/if}}See you soon and best regards<br>Your MINTvernetzt team',
        plainText:
          "{{headline}}\n\nHello {{profile.firstName}},\n\nthe event {{event.name}} takes place soon.\n\nEvent link: {{event.url}}\nDate: {{event.startDate}}, {{event.startTime}} ({{event.timezone}}){{#if event.location}}Location: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Conference link: {{event.conferenceLink}}\n{{/if}}\nWe are very pleased that you will be attending!\n\n{{#if profile.isGuest}}If something changes and you cannot attend after all, please withdraw your participation via the revocation link, so that others can move up.\nRevocation link: {{event.revocationLink}}{{else}}If something changes and you cannot attend after all, please withdraw your participation on the community platform, so that others can move up.{{/if}}\n\nSee you soon and best regards\nYour MINTvernetzt team",
      },
      fifteenMinutesBefore: {
        title: "Last reminder shortly before start",
        subject: "Reminder: The event {{event.name}} is about to start",
        html: 'Hello {{profile.firstName}},<br><br>the event <a href="{{event.url}}" style="text-decoration: underline; font-weight: bold;">{{event.name}}</a> is about to start.<br><br>Date: {{event.startDate}}, {{event.startTime}} ({{event.timezone}})<br>{{#if event.location}}Location: {{event.location}}<br>{{/if}}{{#if event.conferenceLink}}Conference link: <a href="{{event.conferenceLink}}" style="text-decoration: underline;">{{event.conferenceLink}}</a><br>{{/if}}<br>We are very pleased that you are joining us!<br><br>See you soon and best regards<br>Your MINTvernetzt team',
        plainText:
          "{{headline}}\n\nHello {{profile.firstName}},\n\nthe event {{event.name}} is about to start.\n\nEvent link: {{event.url}}\nDate: {{event.startDate}}, {{event.startTime}} ({{event.timezone}})\n{{#if event.location}}Location: {{event.location}}\n{{/if}}{{#if event.conferenceLink}}Conference link: {{event.conferenceLink}}\n{{/if}}\nWe are very pleased that you are joining us!\n\nSee you soon and best regards\nYour MINTvernetzt team",
      },
    },
    footer: {
      html: 'You are receiving this email because you registered for the event <b>{{event.name}}</b> on the MINTvernetzt community platform. If you no longer wish to receive emails, please unsubscribe from <a href="{{profile.revocationLink}}" style="font-weight: bold; text-decoration: underline">this event</a>. Does this email appear to you as spam? Then <a href="{{event.reportUrl}}" style="font-weight: bold; text-decoration: underline">report this event</a>.',
      plainText:
        "You are receiving this email because you registered for the event {{event.name}} on the MINTvernetzt community platform. If you no longer wish to receive emails, please unsubscribe from this event: {{profile.revocationLink}}. Does this email appear to you as spam? Then report this event: {{event.reportUrl}}.",
    },
    timezone: "CET",
  },
} as const;
