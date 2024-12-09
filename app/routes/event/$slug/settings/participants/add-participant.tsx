import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
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
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  profileId: z.string(),
});

export const addParticipantSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(t("error.inputError.doesNotExist"), "profileId");
    }
    const alreadyParticipant = profile.participatedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyParticipant) {
      throw new InputError(t("error.inputError.alreadyIn"), "profileId");
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
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-participants-add-participant",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: {
      eventSlug: slug,
    },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, t("error.notFound"), { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", t("error.notPrivileged"), {
        status: 403,
      });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
      await connectParticipantToEvent(event.id, result.data.profileId);
    } else {
      await connectParticipantToEvent(event.id, result.data.profileId);
    }
    return json({
      success: true,
      message: t("feedback", {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
    });
  }
  return json(result);
};

type AddParticipantButtonProps = {
  action: string;
  profileId?: string;
};

export function AddParticipantButton(props: AddParticipantButtonProps) {
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation([
    "routes-event-settings-participants-add-participant",
  ]);
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
            <button className="btn btn-primary" type="submit">
              {t("action")}
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
