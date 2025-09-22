import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  redirect,
} from "react-router";
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
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

const schema = z.object({
  eventName: z.string().trim().optional(),
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
      console.error({ error });
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
                    prefetch="intent"
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
              className="ml-auto border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white"
            >
              {locales.form.submit.label}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white">
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
