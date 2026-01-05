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
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { cancelEventBySlug, getEventBySlug } from "./cancel.server";
import { ConfirmModalSearchParam } from "./cancel.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/cancel"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.canceled || event.published === false) {
    return redirect(
      `/next/event/${params.slug}/settings/danger-zone/change-url`
    );
  }

  return { locales, event };
}

export async function action(args: ActionFunctionArgs) {
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
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/cancel"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });
  invariantResponse(
    event.canceled === false || event.published,
    "Event already canceled",
    { status: 400 }
  );

  try {
    await cancelEventBySlug(params.slug);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "cancel-error",
      key: `cancel-error-${Date.now()}`,
      message: locales.route.errors.cancelFailed,
      level: "negative",
    });
  }

  return redirectWithToast(`/event/${params.slug}/detail/about`, {
    id: "cancel-success",
    key: `cancel-success-${Date.now()}`,
    message: locales.route.success,
    level: "positive",
  });
}

function Cancel() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const extendedSearchParams = extendSearchParams(searchParams, {
    addOrReplace: {
      [ConfirmModalSearchParam]: "true",
    },
  });

  return (
    <>
      <Hint>{locales.route.hint}</Hint>
      {/* <p>{locales.route.explanation}</p> */}
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
      <Form id="cancel-event-form" method="post" hidden preventScrollReset />
      <Modal searchParam={ConfirmModalSearchParam}>
        <Modal.Title>
          {insertParametersIntoLocale(locales.route.confirmation.title, {
            eventName: loaderData.event.name,
          })}
        </Modal.Title>
        <Modal.Section>{locales.route.confirmation.description}</Modal.Section>
        <Modal.SubmitButton form="cancel-event-form" level="negative">
          {locales.route.confirmation.confirm}
        </Modal.SubmitButton>
        <Modal.CloseButton route={location.pathname}>
          {locales.route.confirmation.abort}
        </Modal.CloseButton>
      </Modal>
    </>
  );
}

export default Cancel;
