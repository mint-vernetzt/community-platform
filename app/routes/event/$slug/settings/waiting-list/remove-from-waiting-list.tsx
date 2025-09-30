import type { ActionFunctionArgs } from "react-router";
import { useFetcher } from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { RemixFormsForm } from "~/components/legacy/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  disconnectFromWaitingListOfEvent,
  getEventBySlug,
} from "./utils.server";
import { type EventDetailLocales } from "../../index.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";

const schema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeFromWaitingListSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/waiting-list/remove-from-waiting-list"
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
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
  }
  return { ...result, locales };
};

type RemoveFromWaitingListButtonProps = {
  action: string;
  profileId?: string;
  locales: EventDetailLocales | ProfileDetailLocales;
};

export function RemoveFromWaitingListButton(
  props: RemoveFromWaitingListButtonProps
) {
  const fetcher = useFetcher<typeof action>();
  const locales = props.locales;
  return (
    <RemixFormsForm action={props.action} fetcher={fetcher} schema={schema}>
      {(remixFormsProps) => {
        const { Errors } = remixFormsProps;
        return (
          <>
            <input name="profileId" defaultValue={props.profileId} hidden />
            <button
              className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
              type="submit"
            >
              {locales.removeFromWaitingList.action}
            </button>
            <Errors />
          </>
        );
      }}
    </RemixFormsForm>
  );
}
