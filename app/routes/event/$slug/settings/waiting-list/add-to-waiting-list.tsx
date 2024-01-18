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
import { connectToWaitingListOfEvent, getEventBySlug } from "./utils.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  profileId: z.string(),
});

export const addToWaitingListSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const profile = await getProfileById(values.profileId);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "profileId"
    );
  }
  const alreadyOnWaitingList = profile.waitingForEvents.some((entry) => {
    return entry.event.slug === environment.eventSlug;
  });
  if (alreadyOnWaitingList) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits auf der Warteliste Eurer Veranstaltung.",
      "profileId"
    );
  }
  const alreadyParticipant = profile.participatedEvents.some((entry) => {
    return entry.event.slug === environment.eventSlug;
  });
  if (alreadyParticipant) {
    throw new InputError(
      "Das Profil unter diesem Namen nimmt bereits bei Eurer Veranstaltung teil. Bitte entferne die Person erst von der Teilnehmer:innenliste.",
      "profileId"
    );
  }
  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      eventSlug: slug,
    },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, "Event not found", { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    } else {
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    }
    return json({
      success: true,
      message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde zur Warteliste hinzugefügt.`,
    });
  }
  return json(result);
};

type AddToWaitingListButtonProps = {
  action: string;
  profileId?: string;
};

export function AddToWaitingListButton(props: AddToWaitingListButtonProps) {
  const fetcher = useFetcher<typeof action>();
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
              Warteliste
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
