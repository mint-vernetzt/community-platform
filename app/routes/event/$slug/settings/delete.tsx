import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { deriveEventMode } from "../../utils.server";
import {
  type DeleteEventLocales,
  getEventBySlug,
  getEventBySlugForAction,
  getProfileById,
} from "./delete.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { deleteEventBySlug } from "./utils.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

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
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/delete"];

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.error.eventNotFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  return {
    published: event.published,
    eventName: event.name,
    childEvents: event.childEvents,
    locales,
  };
};

const createMutation = (locales: DeleteEventLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (values.eventName !== environment.eventName) {
      throw new InputError(locales.error.input, "eventName");
    }
    try {
      await deleteEventBySlug(environment.eventSlug);
    } catch (error) {
      throw locales.error.delete;
    }
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/delete"];
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event, locales.error.eventNotFound, { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { eventSlug: slug, eventName: event.name },
  });

  if (result.success === true) {
    const profile = await getProfileById(sessionUser.id);
    if (profile === null) {
      invariantResponse(false, locales.error.profileNotFound, { status: 404 });
    }
    return redirect(`/profile/${profile.username}`);
  }

  return { ...result };
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const { slug } = useParams();
  const publishFetcher = useFetcher<typeof publishAction>();

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>

      <p className="mb-8">
        {insertParametersIntoLocale(locales.content.intro, {
          name: loaderData.eventName,
        })}
      </p>

      {loaderData.childEvents.length > 0 ? (
        <>
          <p className="mb-2">{locales.content.list}</p>{" "}
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
                    label={locales.form.eventName.label}
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
              {locales.form.submit.label}
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
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published
                        ? locales.form.hide.label
                        : locales.form.publish.label}
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
