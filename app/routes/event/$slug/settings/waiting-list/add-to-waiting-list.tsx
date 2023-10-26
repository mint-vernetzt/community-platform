import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getProfileById } from "../utils.server";
import { connectToWaitingListOfEvent, getEventBySlug } from "./utils.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

const schema = z.object({
  profileId: z.string(),
});

export const addToWaitingListSchema = schema;

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
      throw new InputError(t("error.inputError.notFound"), "profileId");
    }
    const alreadyOnWaitingList = profile.waitingForEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyOnWaitingList) {
      throw new InputError(t("error.inputError.alreadyOn"), "profileId");
    }
    const alreadyParticipant = profile.participatedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadyParticipant) {
      throw new InputError(
        t("error.inputError.alreadyParticipant"),
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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/waiting-list/add-to-waiting-list",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
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
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    } else {
      await connectToWaitingListOfEvent(event.id, result.data.profileId);
    }
    return json(
      {
        success: true,
        message: t("feedback", {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
        }),
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};

type AddToWaitingListButtonProps = {
  action: string;
  profileId?: string;
};

export function AddToWaitingListButton(props: AddToWaitingListButtonProps) {
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation([
    "routes/event/settings/waiting-list/add-to-waiting-list",
  ]);
  return (
    <Form
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
              {t("action")}
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
