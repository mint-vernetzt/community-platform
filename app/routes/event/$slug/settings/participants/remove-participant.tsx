import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useSearchParams } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { disconnectParticipantFromEvent, getEventBySlug } from "./utils.server";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  profileId: z.string(),
});

export const removeParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/event/index"]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, t("error.notFound"), { status: 404 });
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", t("error.notPrivileged"), {
        status: 403,
      });
      await checkFeatureAbilitiesOrThrow(authClient, "events");
    }
    await disconnectParticipantFromEvent(event.id, result.data.profileId);
  }
  return json(result);
};

type RemoveParticipantFormProps = {
  id: string;
  action: string;
  profileId?: string;
  modalSearchParam?: string;
};

export function RemoveParticipantForm(props: RemoveParticipantFormProps) {
  const fetcher = useFetcher<typeof action>();
  const [searchParams, setSearchParam] = useSearchParams();
  const newSearchParams = new URLSearchParams(searchParams);
  if (props.modalSearchParam !== undefined) {
    newSearchParams.delete(props.modalSearchParam);
  }
  const { t } = useTranslation([
    "routes/event/settings/participants/remove-participant",
  ]);

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
                {t("removeParticipant.action")}
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
