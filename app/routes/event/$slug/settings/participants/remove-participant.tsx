import type { ActionFunctionArgs } from "react-router";
import { useFetcher, useSearchParams } from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { disconnectParticipantFromEvent, getEventBySlug } from "./utils.server";
import { type EventDetailLocales } from "../../index.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";

const schema = z.object({
  profileId: z.string().trim().uuid(),
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
      onSubmit={() => {
        setSearchParam(newSearchParams);
      }}
    >
      {(formProps) => {
        const { Errors } = formProps;
        return (
          <>
            <input name="profileId" defaultValue={props.profileId} hidden />
            {props.modalSearchParam === undefined ? (
              <button
                className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                type="submit"
              >
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
