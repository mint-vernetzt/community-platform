import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  disconnectFromWaitingListOfEvent,
  getEventBySlug,
} from "./utils.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  profileId: z.string(),
});

export const removeFromWaitingListSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient, response } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, "Event not found", { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
    }
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
  }
  return json(result, { headers: response.headers });
};

type RemoveFromWaitingListButtonProps = {
  action: string;
  profileId?: string;
};

export function RemoveFromWaitingListButton(
  props: RemoveFromWaitingListButtonProps
) {
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
            <button className="btn btn-primary" type="submit">
              Von der Warteliste entfernen
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
