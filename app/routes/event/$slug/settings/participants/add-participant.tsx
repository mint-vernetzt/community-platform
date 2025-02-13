import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getProfileById } from "../utils.server";
import { connectParticipantToEvent, getEventBySlug } from "./utils.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { type AddEventParticipantLocales } from "./add-participant.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type EventDetailLocales } from "../../index.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";

const schema = z.object({
  profileId: z.string(),
});

export const addParticipantSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (locales: AddEventParticipantLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(locales.error.inputError.doesNotExist, "profileId");
    }
    const alreadyParticipant = profile.participatedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyParticipant) {
      throw new InputError(locales.error.inputError.alreadyIn, "profileId");
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
      "event/$slug/settings/participants/add-participant"
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
      await connectParticipantToEvent(event.id, result.data.profileId);
    } else {
      await connectParticipantToEvent(event.id, result.data.profileId);
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

type AddParticipantButtonProps = {
  action: string;
  profileId?: string;
  locales: EventDetailLocales | ProfileDetailLocales;
};

export function AddParticipantButton(props: AddParticipantButtonProps) {
  const fetcher = useFetcher<typeof action>();
  const locales = props.locales;
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
      {(remixFormsProps) => {
        const { Field, Errors } = remixFormsProps;
        return (
          <>
            <Field name="profileId" />
            <button className="btn btn-primary" type="submit">
              {locales.addParticipant.action}
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
