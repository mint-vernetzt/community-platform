import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getProfileById } from "../utils.server";
import { type AddProfileToEventWaitingListLocales } from "./add-to-waiting-list.server";
import { connectToWaitingListOfEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  profileId: z.string(),
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
      throw new InputError(locales.error.inputError.doesNotExist, "profileId");
    }
    const alreadyOnWaitingList = profile.waitingForEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyOnWaitingList) {
      throw new InputError(locales.error.inputError.alreadyOn, "profileId");
    }
    const alreadyParticipant = profile.participatedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyParticipant) {
      throw new InputError(
        locales.error.inputError.alreadyParticipant,
        "profileId"
      );
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
};

export function AddToWaitingListButton(props: AddToWaitingListButtonProps) {
  const fetcher = useFetcher<typeof action>();
  const locales = fetcher.data !== undefined ? fetcher.data.locales : undefined;
  return (
    <RemixFormsForm
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["profileId"]}
      values={{
        profileId: props.profileId,
      }}
    >
      {(props) => {
        const { Field, Errors } = props;
        return (
          <>
            <Field name="profileId" />
            <button type="submit" className="btn btn-primary">
              {locales !== undefined ? locales.action : "Waiting list"}
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
