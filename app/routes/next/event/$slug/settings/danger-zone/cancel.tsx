import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import {
  Form,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import { detectLanguage } from "~/i18n.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { cancelEventBySlug, getEventBySlug } from "./cancel.server";
import {
  CANCEL_ALL,
  CANCEL_ONLY_THIS,
  ConfirmModalSearchParam,
  createCancelEventSchema,
  HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM,
} from "./cancel.shared";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import { useState } from "react";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import { parseWithZod } from "@conform-to/zod";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/cancel"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.canceled || event.published === false) {
    const url = new URL(request.url);
    url.pathname = `/next/event/${params.slug}/settings/danger-zone/change-url`;
    return redirect(url.toString());
  }

  return { locales, event, language };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
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
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/cancel"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });
  invariantResponse(
    event.canceled === false || event.published,
    "Event already canceled",
    { status: 400 }
  );

  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: createCancelEventSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await cancelEventBySlug({
      slug,
      cancelChildEvents:
        submission.payload[HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM] ===
        CANCEL_ALL,
      locales: {
        mail: {
          subject: locales.route.mail.subject,
        },
      },
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "cancel-error",
      key: `cancel-error-${Date.now()}`,
      message: locales.route.errors.cancelFailed,
      level: "negative",
    });
  }

  return redirectWithToast(`/event/${slug}/detail/about`, {
    id: "cancel-success",
    key: `cancel-success-${Date.now()}`,
    message: locales.route.success,
    level: "positive",
  });
}

function Cancel() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event, language } = loaderData;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const cancelSearchParamValue = searchParams.get(
    HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM
  );

  const [cancel, setCancel] = useState(
    cancelSearchParamValue === CANCEL_ALL ? CANCEL_ALL : CANCEL_ONLY_THIS
  );

  const extendedSearchParams = extendSearchParams(searchParams, {
    addOrReplace: {
      [ConfirmModalSearchParam]: "true",
    },
  });

  const modalLocales =
    cancel === CANCEL_ONLY_THIS
      ? locales.route.confirmation.cancelOnlyThis
      : locales.route.confirmation.cancelAll;

  return (
    <>
      {event._count.childEvents > 0 && (
        <div className="w-full flex flex-col gap-2 p-4 bg-primary-50 lg:rounded-lg">
          <p className="text-primary-700 text-base font-normal leading-5 text-center">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.childEventsList.hint_singular,
                locales.route.childEventsList.hint_plural,
                event._count.childEvents
              ),
              { count: event._count.childEvents }
            )}
          </p>
          <List
            id="child-events-list"
            locales={locales.route.childEventsList}
            hideAfter={0}
          >
            {event.childEvents.map((childEvent, index) => {
              return (
                <ListItemEvent
                  key={childEvent.slug}
                  index={index}
                  to={`/event/${childEvent.slug}/detail/about`}
                >
                  <ListItemEvent.Info
                    {...childEvent}
                    participantCount={childEvent._count.participants}
                    locales={{
                      stages: locales.stages,
                      ...locales.route.childEventsList,
                    }}
                    language={language}
                  />
                  <ListItemEvent.Headline>
                    {childEvent.name}
                  </ListItemEvent.Headline>
                </ListItemEvent>
              );
            })}
          </List>
        </div>
      )}
      <Hint>
        <Hint.InfoIcon />
        {locales.route.hint.explanation}
      </Hint>
      {event._count.childEvents > 0 && (
        <>
          <Hint>
            <Hint.DiagramIcon />
            {locales.route.hint.childEvents}
          </Hint>
          <p>{locales.route.handlingChildEvents.description}</p>
          <RadioButtonSettings
            to={`?${extendSearchParams(searchParams, {
              addOrReplace: {
                [HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM]: CANCEL_ONLY_THIS,
              },
            }).toString()}`}
            active={cancel === CANCEL_ONLY_THIS}
            onClick={(event) => {
              event.preventDefault();
              setCancel(CANCEL_ONLY_THIS);
            }}
          >
            <p className="font-semibold">
              {locales.route.handlingChildEvents.cancelOnlyThis.headline}
            </p>
            <p className="text-sm">
              {locales.route.handlingChildEvents.cancelOnlyThis.description}
            </p>
          </RadioButtonSettings>
          <RadioButtonSettings
            to={`?${extendSearchParams(searchParams, {
              addOrReplace: {
                [HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM]: CANCEL_ALL,
              },
            }).toString()}`}
            active={cancel === CANCEL_ALL}
            onClick={(event) => {
              event.preventDefault();
              setCancel(CANCEL_ALL);
            }}
          >
            <p className="font-semibold">
              {locales.route.handlingChildEvents.cancelAll.headline}
            </p>
            <p className="text-sm">
              {locales.route.handlingChildEvents.cancelAll.description}
            </p>
          </RadioButtonSettings>
        </>
      )}
      <div className="w-full flex justify-end">
        <div className="w-full lg:w-fit">
          <Button
            as="link"
            to={`?${extendedSearchParams.toString()}`}
            level="negative"
            fullSize
          >
            {locales.route.cancel}
          </Button>
        </div>
      </div>
      <Form id="cancel-event-form" method="post" hidden preventScrollReset>
        <input
          type="hidden"
          name={HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM}
          value={cancel}
        />
      </Form>
      <Modal searchParam={ConfirmModalSearchParam}>
        <Modal.Title>
          {insertParametersIntoLocale(modalLocales.title, {
            eventName: loaderData.event.name,
          })}
        </Modal.Title>
        <Modal.Section>{modalLocales.description}</Modal.Section>
        <Modal.SubmitButton form="cancel-event-form" level="negative">
          {modalLocales.confirm}
        </Modal.SubmitButton>
        <Modal.CloseButton route={location.pathname}>
          {modalLocales.abort}
        </Modal.CloseButton>
      </Modal>
    </>
  );
}

export default Cancel;
