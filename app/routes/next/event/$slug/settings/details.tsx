import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { LastTimeStamp } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getFormPersistenceTimestamp } from "~/utils.server";
import {
  getEventBySlug,
  getEventBySlugForAction,
  updateEventBySlug,
} from "./details.server";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import { createEventDetailsSchema } from "./details.shared";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const url = new URL(request.url);
  const lastTimeStampParam = url.searchParams.get(LastTimeStamp);
  const currentTimestamp = getFormPersistenceTimestamp(lastTimeStampParam);

  return { locales, language, event, currentTimestamp };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  const formData = await request.formData();

  const schema = createEventDetailsSchema(locales.route.form.validation);
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const event = await getEventBySlugForAction(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  try {
    await updateEventBySlug(params.slug, event.id, submission.value);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "event-details-error",
      key: `event-details-error-${Date.now()}`,
      message: locales.route.errors.saveFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "event-details-success",
    key: `event-details-success-${Date.now()}`,
    message: locales.route.success,
  });
};

export default function Details() {
  return <>Details</>;
}
