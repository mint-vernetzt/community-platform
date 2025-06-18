import { z } from "zod";
import { type EventDetailLocales } from "./index.server";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { RemoveParticipantForm } from "./settings/participants/remove-participant";
import { Form } from "react-router";
import { Modal } from "~/components-next/Modal";
import { RemoveFromWaitingListButton } from "./settings/waiting-list/remove-from-waiting-list";
import { AddToWaitingListButton } from "./settings/waiting-list/add-to-waiting-list";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { type ArrayElement } from "~/lib/utils/types";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";

export const OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH = 250;

export const createAbuseReportSchema = (locales: EventDetailLocales) =>
  z.object({
    [INTENT_FIELD_NAME]: z.enum(["submit-abuse-report"]),
    reasons: z.array(z.string()),
    otherReason: z
      .string()
      .max(
        OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.abuseReport.max, {
          max: OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH,
        })
      )
      .optional(),
  });

export function getCallToActionForm(loaderData: {
  locales: EventDetailLocales;
  userId?: string;
  isParticipant: boolean;
  isOnWaitingList: boolean;
  event: {
    id: string;
    participantLimit: number | null;
    _count: {
      participants: number;
    };
  };
}) {
  const isParticipating = loaderData.isParticipant;
  const isOnWaitingList = loaderData.isOnWaitingList;

  const participantLimitReached =
    loaderData.event.participantLimit !== null
      ? loaderData.event.participantLimit <=
        loaderData.event._count.participants
      : false;

  if (isParticipating) {
    return (
      <>
        <Form method="get" preventScrollReset>
          <input hidden name="modal-remove-participant" defaultValue="true" />
          <button
            type="submit"
            className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
          >
            {loaderData.locales.route.content.event.removeParticipant.action}
          </button>
        </Form>
        <div className="mv-hidden">
          <RemoveParticipantForm
            id="remove-participant"
            action="./settings/participants/remove-participant"
            profileId={loaderData.userId}
            modalSearchParam="modal-remove-participant"
            locales={loaderData.locales}
          />
        </div>
        <Modal searchParam="modal-remove-participant">
          <Modal.Title>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.title
            }
          </Modal.Title>
          <Modal.Section>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.description
            }
          </Modal.Section>
          <Modal.SubmitButton form="remove-participant">
            {loaderData.locales.route.content.event.removeParticipant.action}
          </Modal.SubmitButton>
          <Modal.CloseButton>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.abort
            }
          </Modal.CloseButton>
        </Modal>
      </>
    );
  } else if (isOnWaitingList) {
    return (
      <RemoveFromWaitingListButton
        action="./settings/waiting-list/remove-from-waiting-list"
        profileId={loaderData.userId}
        locales={loaderData.locales}
      />
    );
  } else {
    if (participantLimitReached) {
      return (
        <AddToWaitingListButton
          action="./settings/waiting-list/add-to-waiting-list"
          profileId={loaderData.userId}
          locales={loaderData.locales}
        />
      );
    } else {
      return (
        <AddParticipantButton
          action="./settings/participants/add-participant"
          profileId={loaderData.userId}
          locales={loaderData.locales}
        />
      );
    }
  }
}

export function formatDateTime(
  date: Date,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>,
  locales: EventDetailLocales
) {
  return insertParametersIntoLocale(locales.route.content.clock, {
    date: date.toLocaleDateString(language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
