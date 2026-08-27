import type Mail from "nodemailer/lib/mailer";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { createTransport } from "nodemailer";
import type { OneOf } from "./lib/utils/types";

// Mailer configuration
type MailerOptions = {
  host: string;
  port: number;
  auth?: {
    user: string;
    pass: string;
  };
};

export const mailerOptions = {
  host: process.env.MAILER_HOST,
  port: parseInt(process.env.MAILER_PORT),
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
};

export async function mailer(
  options: MailerOptions,
  from: Mail.Options["from"],
  to: Mail.Options["to"],
  subject: Mail.Options["subject"],
  text: Mail.Options["text"],
  html: Mail.Options["html"]
) {
  const transporter = createTransport(
    options.auth?.user !== ""
      ? options
      : { host: options.host, port: options.port }
  );

  await transporter
    .sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
    .catch((error) => {
      throw new Error(error);
    });
}

// Message configuration
type StandardMessageContent = {
  headline: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
};

type ClaimOrganizationRequestCreatedContent = {
  headline: string;
  claimer: {
    firstName: string;
    lastName: string;
  };
  organization: {
    name: string;
  };
  supportMail: string;
  profileButtonText: string;
  profileButtonUrl: string;
  organizationButtonText: string;
  organizationButtonUrl: string;
};

type ClaimOrganizationRequestWithdrawnContent = {
  headline: string;
  claimer: {
    firstName: string;
    lastName: string;
  };
  organization: {
    name: string;
  };
  profileButtonUrl: string;
  organizationButtonUrl: string;
};

type WelcomeContent = {
  headline: { de: string; en: string };
  firstName: string;
  email: string;
  url: string;
  supportMail: string;
  contact: {
    firstName: string;
    url: string;
  };
};

type InactivityContent = {
  headline: string;
  firstName: string;
  button: {
    url: string;
    text: string;
  };
};

type InactivityLastReminderContent = InactivityContent & {
  deletionDate: string;
};

type AbuseReportSupportContent = {
  reporter: {
    url: string;
    email: string;
  };
  entityUrl: string;
  reasons: string[];
};

type InviteContent = {
  firstName: string;
  button: {
    url: string;
    text: string;
  };
} & OneOf<{ organization: { name: string }; event: { name: string } }>;

type InviteAcceptedOrRejectedContent = {
  firstName: string;
} & (
  | (OneOf<{ organization: { name: string }; event: { name: string } }> & {
      profile: {
        firstName: string;
        lastName: string;
      };
    })
  | {
      organization: { name: string };
      event: { name: string };
    }
);

type RequestContent = {
  firstName: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  organization: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type RequestCanceledContent = {
  firstName: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  organization: { name: string };
};

type RequestAcceptedOrRejectedContent = {
  firstName: string;
  organization: { name: string };
};

type RequestNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type RequestNetworkAcceptedOrRejectedContent = {
  firstName: string;
  network: { name: string };
};

type RequestCanceledNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type InviteProfileToJoinContent = {
  firstName: string;
} & OneOf<{
  organization: { name: string };
  event: { name: string };
}>;

type InviteNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type InviteNetworkAcceptedOrRejectedContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type InviteCanceledNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type GeneralNotificationAddOrRemovedFromEventContent = {
  firstName: string;
  event: {
    name: string;
  };
};

type GeneralNotificationEventCanceledContent =
  GeneralNotificationAddOrRemovedFromEventContent;

type ChildAndParentEventConnection = {
  firstName: string;
  event: {
    name: string;
  };
  parentEvent: {
    name: string;
  };
};

type GuestsContent = {
  headline: {
    de: string;
    en: string;
  };
  firstName: string;
  eventName: string;
  url: string;
};

type ProfileOrGuestAddedToParticipantsOrWaitingListContent = {
  headline: {
    de: string;
    en: string;
  };
  profile: {
    firstName: string;
    isGuest: boolean;
    isOnWaitingList: boolean;
  };
  event: {
    name: string;
    url: string;
    date: {
      de: string;
      en: string;
    };
    location?: string;
    conferenceLink?: string | null;
    icsLink: string;
    revocationLink?: string | null;
  };
};

type ProfileOrGuestMovedUpToParticipantsContent = {
  headline: {
    de: string;
    en: string;
  };
  profile: {
    firstName: string;
    isGuest: boolean;
  };
  event: {
    name: string;
    url: string;
    date: {
      de: string;
      en: string;
    };
    location?: string;
    conferenceLink?: string | null;
    revocationLink?: string | null;
  };
};

type ProfileOrGuestRemovedFromParticipantsOrWaitingListContent = {
  headline: string;
  profile: {
    firstName: string;
    isOnWaitingList: boolean;
  };
  event: {
    name: string;
  };
};

type ReminderContent = {
  headline: string;
  profile: {
    firstName: string;
    isGuest: boolean;
  };
  event: {
    name: string;
    url: string;
    startDate: string;
    startTime: string;
    timezone: string;
    location?: string;
    conferenceLink?: string | null;
    revocationLink?: string | null;
  };
};

export type TemplatePath =
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  | "mail-templates/claim-organization/created-html.hbs"
  | "mail-templates/claim-organization/created-text.hbs"
  | "mail-templates/claim-organization/withdrawn-html.hbs"
  | "mail-templates/claim-organization/withdrawn-text.hbs"
  | "mail-templates/welcome/html.hbs"
  | "mail-templates/welcome/text.hbs"
  | "mail-templates/inactivity/first-html.hbs"
  | "mail-templates/inactivity/first-text.hbs"
  | "mail-templates/inactivity/second-html.hbs"
  | "mail-templates/inactivity/second-text.hbs"
  | "mail-templates/inactivity/last-html.hbs"
  | "mail-templates/inactivity/last-text.hbs"
  | "mail-templates/inactivity/deleted-html.hbs"
  | "mail-templates/inactivity/deleted-text.hbs"
  | "mail-templates/abuse-report-support/html.hbs"
  | "mail-templates/abuse-report-support/text.hbs"
  | "mail-templates/requests/organization-to-add-profile/html.hbs"
  | "mail-templates/requests/organization-to-add-profile/text.hbs"
  | "mail-templates/requests/organization-to-add-profile/accepted-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/accepted-text.hbs"
  | "mail-templates/requests/organization-to-add-profile/canceled-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/canceled-text.hbs"
  | "mail-templates/requests/organization-to-add-profile/rejected-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/html.hbs"
  | "mail-templates/invites/profile-to-join-organization/text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-canceled-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/canceled-text.hbs"
  | "mail-templates/requests/network-to-add-organization/html.hbs"
  | "mail-templates/requests/network-to-add-organization/text.hbs"
  | "mail-templates/requests/network-to-add-organization/accepted-html.hbs"
  | "mail-templates/requests/network-to-add-organization/accepted-text.hbs"
  | "mail-templates/requests/network-to-add-organization/rejected-html.hbs"
  | "mail-templates/requests/network-to-add-organization/rejected-text.hbs"
  | "mail-templates/requests/network-to-add-organization/canceled-html.hbs"
  | "mail-templates/requests/network-to-add-organization/canceled-text.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/html.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/text.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/canceled-html.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/canceled-text.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/accepted-html.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/accepted-text.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/rejected-html.hbs"
  | "mail-templates/requests/parent-event-to-add-child-event/rejected-text.hbs"
  | "mail-templates/invites/organization-to-join-network/text.hbs"
  | "mail-templates/invites/organization-to-join-network/html.hbs"
  | "mail-templates/invites/organization-to-join-network/accepted-text.hbs"
  | "mail-templates/invites/organization-to-join-network/accepted-html.hbs"
  | "mail-templates/invites/organization-to-join-network/rejected-text.hbs"
  | "mail-templates/invites/organization-to-join-network/rejected-html.hbs"
  | "mail-templates/invites/organization-to-join-network/canceled-text.hbs"
  | "mail-templates/invites/organization-to-join-network/canceled-html.hbs"
  | "mail-templates/invites/organization-to-join-event/html.hbs"
  | "mail-templates/invites/organization-to-join-event/text.hbs"
  | "mail-templates/invites/organization-to-join-event/canceled-html.hbs"
  | "mail-templates/invites/organization-to-join-event/canceled-text.hbs"
  | "mail-templates/invites/organization-to-join-event/accepted-html.hbs"
  | "mail-templates/invites/organization-to-join-event/accepted-text.hbs"
  | "mail-templates/invites/organization-to-join-event/rejected-html.hbs"
  | "mail-templates/invites/organization-to-join-event/rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-admin-canceled-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-member-canceled-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-speaker-canceled-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-canceled-html.hbs"
  | "mail-templates/invites/profile-to-join-event/as-participant-canceled-text.hbs"
  | "mail-templates/general-notification/remove-admin-from-event-html.hbs"
  | "mail-templates/general-notification/remove-admin-from-event-text.hbs"
  | "mail-templates/general-notification/remove-team-member-from-event-html.hbs"
  | "mail-templates/general-notification/remove-team-member-from-event-text.hbs"
  | "mail-templates/general-notification/remove-contact-person-from-event-html.hbs"
  | "mail-templates/general-notification/remove-contact-person-from-event-text.hbs"
  | "mail-templates/general-notification/add-contact-person-from-event-html.hbs"
  | "mail-templates/general-notification/add-contact-person-from-event-text.hbs"
  | "mail-templates/general-notification/remove-speaker-from-event-html.hbs"
  | "mail-templates/general-notification/remove-speaker-from-event-text.hbs"
  | "mail-templates/general-notification/remove-responsible-org-from-event-html.hbs"
  | "mail-templates/general-notification/remove-responsible-org-from-event-text.hbs"
  | "mail-templates/general-notification/remove-participant-from-event-html.hbs"
  | "mail-templates/general-notification/remove-participant-from-event-text.hbs"
  | "mail-templates/general-notification/disconnect-from-parent-event-html.hbs"
  | "mail-templates/general-notification/disconnect-from-parent-event-text.hbs"
  | "mail-templates/general-notification/event-canceled-html.hbs"
  | "mail-templates/general-notification/event-canceled-text.hbs"
  | "mail-templates/guests/profile-already-exists-html.hbs"
  | "mail-templates/guests/profile-already-exists-text.hbs"
  | "mail-templates/guests/confirm-registration-html.hbs"
  | "mail-templates/guests/confirm-registration-text.hbs"
  | "mail-templates/guests/guest-already-exists-html.hbs"
  | "mail-templates/guests/guest-already-exists-text.hbs"
  | "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-html.hbs"
  | "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-text.hbs"
  | "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs"
  | "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs"
  | "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-html.hbs"
  | "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-text.hbs"
  | "mail-templates/event/reminder-one-day-before-html.hbs"
  | "mail-templates/event/reminder-one-day-before-text.hbs"
  | "mail-templates/event/reminder-one-hour-before-html.hbs"
  | "mail-templates/event/reminder-one-hour-before-text.hbs"
  | "mail-templates/event/reminder-fifteen-minutes-before-html.hbs"
  | "mail-templates/event/reminder-fifteen-minutes-before-text.hbs";

type TemplateContent<TemplatePath> = TemplatePath extends
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  ? StandardMessageContent
  : TemplatePath extends
        | "mail-templates/claim-organization/created-html.hbs"
        | "mail-templates/claim-organization/created-text.hbs"
    ? ClaimOrganizationRequestCreatedContent
    : TemplatePath extends
          | "mail-templates/claim-organization/withdrawn-html.hbs"
          | "mail-templates/claim-organization/withdrawn-text.hbs"
      ? ClaimOrganizationRequestWithdrawnContent
      : TemplatePath extends
            | "mail-templates/welcome/html.hbs"
            | "mail-templates/welcome/text.hbs"
        ? WelcomeContent
        : TemplatePath extends
              | "mail-templates/inactivity/last-html.hbs"
              | "mail-templates/inactivity/last-text.hbs"
          ? InactivityLastReminderContent
          : TemplatePath extends
                | "mail-templates/inactivity/first-html.hbs"
                | "mail-templates/inactivity/first-text.hbs"
                | "mail-templates/inactivity/second-html.hbs"
                | "mail-templates/inactivity/second-text.hbs"
                | "mail-templates/inactivity/deleted-html.hbs"
                | "mail-templates/inactivity/deleted-text.hbs"
            ? InactivityContent
            : TemplatePath extends
                  | "mail-templates/abuse-report-support/html.hbs"
                  | "mail-templates/abuse-report-support/text.hbs"
              ? AbuseReportSupportContent
              : TemplatePath extends
                    | "mail-templates/invites/profile-to-join-organization/text.hbs"
                    | "mail-templates/invites/profile-to-join-organization/html.hbs"
                    | "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs"
                    | "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs"
                ? InviteContent
                : TemplatePath extends
                      | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
                      | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
                      | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
                      | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
                      | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
                      | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
                      | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
                      | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
                  ? InviteAcceptedOrRejectedContent
                  : TemplatePath extends
                        | "mail-templates/requests/organization-to-add-profile/html.hbs"
                        | "mail-templates/requests/organization-to-add-profile/text.hbs"
                    ? RequestContent
                    : TemplatePath extends
                          | "mail-templates/requests/organization-to-add-profile/canceled-html.hbs"
                          | "mail-templates/requests/organization-to-add-profile/canceled-text.hbs"
                      ? RequestCanceledContent
                      : TemplatePath extends
                            | "mail-templates/requests/organization-to-add-profile/accepted-html.hbs"
                            | "mail-templates/requests/organization-to-add-profile/accepted-text.hbs"
                            | "mail-templates/requests/organization-to-add-profile/rejected-html.hbs"
                            | "mail-templates/requests/organization-to-add-profile/rejected-text.hbs"
                        ? RequestAcceptedOrRejectedContent
                        : TemplatePath extends
                              | "mail-templates/requests/network-to-add-organization/html.hbs"
                              | "mail-templates/requests/network-to-add-organization/text.hbs"
                          ? RequestNetworkContent
                          : TemplatePath extends
                                | "mail-templates/requests/network-to-add-organization/accepted-html.hbs"
                                | "mail-templates/requests/network-to-add-organization/accepted-text.hbs"
                                | "mail-templates/requests/network-to-add-organization/rejected-html.hbs"
                                | "mail-templates/requests/network-to-add-organization/rejected-text.hbs"
                            ? RequestNetworkAcceptedOrRejectedContent
                            : TemplatePath extends
                                  | "mail-templates/requests/network-to-add-organization/canceled-html.hbs"
                                  | "mail-templates/requests/network-to-add-organization/canceled-text.hbs"
                              ? RequestCanceledNetworkContent
                              : TemplatePath extends
                                    | "mail-templates/invites/organization-to-join-network/html.hbs"
                                    | "mail-templates/invites/organization-to-join-network/text.hbs"
                                ? InviteNetworkContent
                                : TemplatePath extends
                                      | "mail-templates/invites/organization-to-join-network/accepted-html.hbs"
                                      | "mail-templates/invites/organization-to-join-network/accepted-text.hbs"
                                      | "mail-templates/invites/organization-to-join-network/rejected-html.hbs"
                                      | "mail-templates/invites/organization-to-join-network/rejected-text.hbs"
                                  ? InviteNetworkAcceptedOrRejectedContent
                                  : TemplatePath extends
                                        | "mail-templates/invites/organization-to-join-network/canceled-html.hbs"
                                        | "mail-templates/invites/organization-to-join-network/canceled-text.hbs"
                                    ? InviteCanceledNetworkContent
                                    : TemplatePath extends
                                          | "mail-templates/invites/profile-to-join-event/as-admin-html.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-admin-text.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-member-html.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-member-text.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-speaker-html.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-speaker-text.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-participant-html.hbs"
                                          | "mail-templates/invites/profile-to-join-event/as-participant-text.hbs"
                                          | "mail-templates/invites/organization-to-join-event/html.hbs"
                                          | "mail-templates/invites/organization-to-join-event/text.hbs"
                                          | "mail-templates/requests/parent-event-to-add-child-event/html.hbs"
                                          | "mail-templates/requests/parent-event-to-add-child-event/text.hbs"
                                          | "mail-templates/requests/parent-event-to-add-child-event/canceled-html.hbs"
                                          | "mail-templates/requests/parent-event-to-add-child-event/canceled-text.hbs"
                                      ? InviteContent
                                      : TemplatePath extends
                                            | "mail-templates/invites/profile-to-join-event/as-admin-accepted-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-admin-accepted-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-admin-rejected-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-admin-rejected-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-member-accepted-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-member-accepted-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-member-rejected-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-member-rejected-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-speaker-accepted-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-speaker-accepted-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-speaker-rejected-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-speaker-rejected-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-participant-accepted-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-participant-accepted-text.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-participant-rejected-html.hbs"
                                            | "mail-templates/invites/profile-to-join-event/as-participant-rejected-text.hbs"
                                            | "mail-templates/invites/organization-to-join-event/accepted-html.hbs"
                                            | "mail-templates/invites/organization-to-join-event/accepted-text.hbs"
                                            | "mail-templates/invites/organization-to-join-event/rejected-html.hbs"
                                            | "mail-templates/invites/organization-to-join-event/rejected-text.hbs"
                                        ? InviteAcceptedOrRejectedContent
                                        : TemplatePath extends
                                              | "mail-templates/invites/profile-to-join-organization/as-admin-canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-organization/as-admin-canceled-text.hbs"
                                              | "mail-templates/invites/profile-to-join-organization/canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-organization/canceled-text.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-admin-canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-admin-canceled-text.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-member-canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-member-canceled-text.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-speaker-canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-speaker-canceled-text.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-participant-canceled-html.hbs"
                                              | "mail-templates/invites/profile-to-join-event/as-participant-canceled-text.hbs"
                                              | "mail-templates/invites/organization-to-join-event/canceled-html.hbs"
                                              | "mail-templates/invites/organization-to-join-event/canceled-text.hbs"
                                          ? InviteProfileToJoinContent
                                          : TemplatePath extends
                                                | "mail-templates/general-notification/remove-admin-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-admin-from-event-text.hbs"
                                                | "mail-templates/general-notification/remove-team-member-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-team-member-from-event-text.hbs"
                                                | "mail-templates/general-notification/remove-contact-person-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-contact-person-from-event-text.hbs"
                                                | "mail-templates/general-notification/add-contact-person-from-event-html.hbs"
                                                | "mail-templates/general-notification/add-contact-person-from-event-text.hbs"
                                                | "mail-templates/general-notification/remove-speaker-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-speaker-from-event-text.hbs"
                                                | "mail-templates/general-notification/remove-responsible-org-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-responsible-org-from-event-text.hbs"
                                                | "mail-templates/general-notification/remove-participant-from-event-html.hbs"
                                                | "mail-templates/general-notification/remove-participant-from-event-text.hbs"
                                            ? GeneralNotificationAddOrRemovedFromEventContent
                                            : TemplatePath extends
                                                  | "mail-templates/general-notification/event-canceled-html.hbs"
                                                  | "mail-templates/general-notification/event-canceled-text.hbs"
                                              ? GeneralNotificationEventCanceledContent
                                              : TemplatePath extends
                                                    | "mail-templates/general-notification/disconnect-from-parent-event-html.hbs"
                                                    | "mail-templates/general-notification/disconnect-from-parent-event-text.hbs"
                                                    | "mail-templates/requests/parent-event-to-add-child-event/accepted-html.hbs"
                                                    | "mail-templates/requests/parent-event-to-add-child-event/accepted-text.hbs"
                                                    | "mail-templates/requests/parent-event-to-add-child-event/rejected-html.hbs"
                                                    | "mail-templates/requests/parent-event-to-add-child-event/rejected-text.hbs"
                                                ? ChildAndParentEventConnection
                                                : TemplatePath extends
                                                      | "mail-templates/guests/profile-already-exists-html.hbs"
                                                      | "mail-templates/guests/profile-already-exists-text.hbs"
                                                      | "mail-templates/guests/confirm-registration-html.hbs"
                                                      | "mail-templates/guests/confirm-registration-text.hbs"
                                                      | "mail-templates/guests/guest-already-exists-html.hbs"
                                                      | "mail-templates/guests/guest-already-exists-text.hbs"
                                                  ? GuestsContent
                                                  : TemplatePath extends
                                                        | "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-html.hbs"
                                                        | "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-text.hbs"
                                                    ? ProfileOrGuestAddedToParticipantsOrWaitingListContent
                                                    : TemplatePath extends
                                                          | "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs"
                                                          | "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs"
                                                      ? ProfileOrGuestMovedUpToParticipantsContent
                                                      : TemplatePath extends
                                                            | "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-html.hbs"
                                                            | "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-text.hbs"
                                                        ? ProfileOrGuestRemovedFromParticipantsOrWaitingListContent
                                                        : TemplatePath extends
                                                              | "mail-templates/event/reminder-one-day-before-html.hbs"
                                                              | "mail-templates/event/reminder-one-day-before-text.hbs"
                                                              | "mail-templates/event/reminder-one-hour-before-html.hbs"
                                                              | "mail-templates/event/reminder-one-hour-before-text.hbs"
                                                              | "mail-templates/event/reminder-fifteen-minutes-before-html.hbs"
                                                              | "mail-templates/event/reminder-fifteen-minutes-before-text.hbs"
                                                          ? ReminderContent
                                                          : never;

export function getCompiledMailTemplate<T extends TemplatePath>(
  templatePath: TemplatePath,
  content: TemplateContent<T>,
  type: "text" | "html" = "html"
) {
  const bodyTemplateSource = fs.readFileSync(templatePath, {
    encoding: "utf8",
  });
  const bodyTemplate = Handlebars.compile(bodyTemplateSource, {});
  const body = bodyTemplate(content);
  if (type === "text") {
    return body;
  }
  // On html templates we have header and footer (see mail-templates/layout.hbs)
  const baseUrl = process.env.COMMUNITY_BASE_URL;
  const layoutTemplateSource = fs.readFileSync("mail-templates/layout.hbs", {
    encoding: "utf8",
  });
  const layoutTemplate = Handlebars.compile(layoutTemplateSource, {});
  Handlebars.registerPartial("body", body);
  const compiledHtml = layoutTemplate({ baseUrl });

  return compiledHtml;
}
