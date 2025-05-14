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
      <h1 className="mv-mb-8">{locales.content.headline}</h1>

      <p className="mv-mb-8">
        {insertParametersIntoLocale(locales.content.intro, {
          name: loaderData.eventName,
        })}
      </p>

      {loaderData.childEvents.length > 0 ? (
        <>
          <p className="mv-mb-2">{locales.content.list}</p>{" "}
          <ul className="mv-mb-8">
            {loaderData.childEvents.map((childEvent) => {
              return (
                <li key={`child-event-${childEvent.id}`}>
                  -{" "}
                  <Link
                    className="mv-underline hover:mv-no-underline"
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
              className="mv-ml-auto mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
            >
              {locales.form.submit.label}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
      <footer className="mv-fixed mv-bg-white mv-border-t-2 mv-border-primary mv-w-full mv-inset-x-0 mv-bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="mv-hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
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
