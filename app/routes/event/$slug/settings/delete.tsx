import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveEventMode } from "../../utils.server";
import {
  getEventBySlug,
  getEventBySlugForAction,
  getProfileById,
} from "./delete.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { deleteEventBySlug } from "./utils.server";

const schema = z.object({
  eventName: z.string().optional(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
  eventName: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes-event-settings-delete"]);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.eventNotFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  return json({
    published: event.published,
    eventName: event.name,
    childEvents: event.childEvents,
  });
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (values.eventName !== environment.eventName) {
      throw new InputError(t("error.input"), "eventName");
    }
    try {
      await deleteEventBySlug(environment.eventSlug);
    } catch (error) {
      throw t("error.delete");
    }
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes-event-settings-delete"]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event, t("error.eventNotFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { eventSlug: slug, eventName: event.name },
  });

  if (result.success === true) {
    const profile = await getProfileById(sessionUser.id);
    if (profile === null) {
      throw json(t("error.profileNotFound"), { status: 404 });
    }
    return redirect(`/profile/${profile.username}`);
  }

  return json(result);
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { slug } = useParams();
  const publishFetcher = useFetcher<typeof publishAction>();
  const { t } = useTranslation(["routes-event-settings-delete"]);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <p className="mb-8">
        {t("content.intro", { name: loaderData.eventName })}
      </p>

      {loaderData.childEvents.length > 0 ? (
        <>
          <p className="mb-2">{t("content.list")}</p>{" "}
          <ul className="mb-8">
            {loaderData.childEvents.map((childEvent) => {
              return (
                <li key={`child-event-${childEvent.id}`}>
                  -{" "}
                  <Link
                    className="underline hover:no-underline"
                    to={`/event/${childEvent.slug}`}
                  >
                    {childEvent.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      <RemixFormsForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="eventName" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="eventName"
                    label={t("form.eventName.label")}
                    {...register("eventName")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              {t("form.submit.label")}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published
                        ? t("form.hide.label")
                        : t("form.publish.label")}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Delete;
