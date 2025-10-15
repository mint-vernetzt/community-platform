import { makeDomainFunction } from "domain-functions";
import type { ActionFunctionArgs } from "react-router";
import { useFetcher } from "react-router";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";
import { type EventDetailLocales } from "../../index.server";
import { getProfileById } from "../utils.server";
import { type AddProfileToEventWaitingListLocales } from "./add-to-waiting-list.server";
import { connectToWaitingListOfEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  profileId: z.string().trim().uuid(),
});

export const addToWaitingListSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (locales: AddProfileToEventWaitingListLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw locales.error.inputError.doesNotExist;
    }
    const alreadyOnWaitingList = profile.waitingForEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyOnWaitingList) {
      throw locales.error.inputError.alreadyOn;
    }
    const alreadyParticipant = profile.participatedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyParticipant) {
      throw locales.error.inputError.alreadyParticipant;
    }
    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/waiting-list/add-to-waiting-list"
    ];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: {
      eventSlug: slug,
    },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", locales.error.notPrivileged, {
        status: 403,
      });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    } else {
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    }
    return {
      success: true,
      message: insertParametersIntoLocale(locales.feedback, {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
      locales,
    };
  }
  return { ...result, locales };
};

type AddToWaitingListButtonProps = {
  action: string;
  profileId?: string;
  locales: EventDetailLocales | ProfileDetailLocales;
};

export function AddToWaitingListButton(props: AddToWaitingListButtonProps) {
  const fetcher = useFetcher<typeof action>();
  const locales = props.locales;
  return (
    <fetcher.Form method="post" action={props.action}>
      <input name="profileId" defaultValue={props.profileId} hidden />
      <button
        type="submit"
        className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
      >
        {locales.addToWaitingList.action}
      </button>
    </fetcher.Form>
  );
}
