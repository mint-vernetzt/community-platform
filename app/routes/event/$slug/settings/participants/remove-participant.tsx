import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useSearchParams } from "@remix-run/react";
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
import { type EventDetailLocales } from "../../index.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";

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

type RemoveParticipantFormProps = {
  id: string;
  action: string;
  profileId?: string;
  modalSearchParam?: string;
  locales: EventDetailLocales | ProfileDetailLocales;
};

export function RemoveParticipantForm(props: RemoveParticipantFormProps) {
  const fetcher = useFetcher<typeof action>();
  const locales = props.locales;
  const [searchParams, setSearchParam] = useSearchParams();
  const newSearchParams = new URLSearchParams(searchParams);
  if (props.modalSearchParam !== undefined) {
    newSearchParams.delete(props.modalSearchParam);
  }

  return (
    <RemixFormsForm
      id={props.id}
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["profileId"]}
      values={{
        profileId: props.profileId,
      }}
      onSubmit={() => {
        setSearchParam(newSearchParams);
      }}
    >
      {(formProps) => {
        const { Field, Errors } = formProps;
        return (
          <>
            <Field name="profileId" />
            {props.modalSearchParam === undefined ? (
              <button className="btn btn-primary" type="submit">
                {locales.removeParticipant.action}
              </button>
            ) : (
              <input
                type="hidden"
                name={props.modalSearchParam}
                value="false"
              />
            )}
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
