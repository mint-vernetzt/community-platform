import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { disconnectParticipantFromEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  profileId: z.string(),
});

export const removeParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/participants/remove-participant"
    ];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", locales.error.notPrivileged, {
        status: 403,
      });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
    }
    await disconnectParticipantFromEvent(event.id, result.data.profileId);
  }
  return { ...result, locales };
};

type RemoveParticipantButtonProps = {
  action: string;
  profileId?: string;
};

export function RemoveParticipantButton(props: RemoveParticipantButtonProps) {
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
            <button className="btn btn-primary" type="submit">
              {locales !== undefined ? locales.action : "Don't participate"}
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
