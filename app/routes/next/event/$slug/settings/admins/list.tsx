import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getAdminsOfEvent,
  getEventBySlug,
  removeAdminFromEvent,
} from "./list.server";
import {
  CONFIRM_MODAL_SEARCH_PARAM,
  getRemoveAdminSchema,
  getSearchAdminsSchema,
  SEARCH_ADMINS_SEARCH_PARAM,
} from "./list.shared";
import { extendSearchParams } from "~/lib/utils/searchParams";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/admins/list"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, admins } = await getAdminsOfEvent({
    slug: params.slug,
    authClient,
    searchParams,
  });

  return { locales, admins, submission, userId: sessionUser.id };
};

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
    languageModuleMap[language]["next/event/$slug/settings/admins/list"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event._count.admins <= 1) {
    return redirectWithToast(request.url, {
      id: "remove-last-admin-error",
      key: `remove-last-admin-error-${Date.now()}`,
      message: locales.route.errors.removeLastAdmin,
      level: "negative",
    });
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: getRemoveAdminSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await removeAdminFromEvent({
      adminId: submission.value.adminId,
      eventId: event.id,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "remove-admin-error",
      key: `remove-admin-error-${Date.now()}`,
      message: locales.route.errors.removeAdminFailed,
      level: "negative",
    });
  }

  if (sessionUser.id === submission.value.adminId) {
    return redirectWithToast("/dashboard", {
      id: "remove-self-as-admin-success",
      key: `remove-self-as-admin-success-${Date.now()}`,
      message: insertParametersIntoLocale(
        locales.route.success.removeSelfAsAdmin,
        { eventName: event.name }
      ),
      level: "positive",
    });
  }

  return redirectWithToast(request.url, {
    id: "remove-admin-success",
    key: `remove-admin-success-${Date.now()}`,
    message: locales.route.success.removeAdmin,
    level: "positive",
  });
}

function AdminsList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;
  const [admins, setAdmins] = useState(loaderData.admins);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setAdmins(loaderData.admins);
  }, [loaderData.admins]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      {loaderData.admins.length <= 1 && (
        <Hint>
          {insertComponentsIntoLocale(locales.route.explanation, [
            <span key="strong" className="font-semibold" />,
          ])}
        </Hint>
      )}
      <List id="participants-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.admins}
          setValues={setAdmins}
          searchParam={SEARCH_ADMINS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchAdminsSchema()}
        />
        {admins.map((admin, index) => {
          return (
            <ListItemPersonOrg
              key={admin.id}
              index={index}
              // to={`/profile/${admin.username}`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...admin} />
              <ListItemPersonOrg.Headline>
                {admin.academicTitle !== null && admin.academicTitle.length > 0
                  ? `${admin.academicTitle} `
                  : ""}
                {admin.firstName} {admin.lastName}
              </ListItemPersonOrg.Headline>
              {loaderData.admins.length > 1 && (
                <ListItemPersonOrg.Controls>
                  {loaderData.userId === admin.id ? (
                    <>
                      <Button
                        variant="outline"
                        as="link"
                        to={`?${extendSearchParams(searchParams, { addOrReplace: { [CONFIRM_MODAL_SEARCH_PARAM]: "true" } }).toString()}`}
                        preventScrollReset
                      >
                        {locales.route.list.remove}
                      </Button>
                      <Form
                        id={`remove-admin-form-${admin.id}`}
                        method="POST"
                        preventScrollReset
                        hidden
                      >
                        <input name="adminId" defaultValue={admin.id} />
                      </Form>
                      <Modal searchParam={CONFIRM_MODAL_SEARCH_PARAM}>
                        <Modal.Title>
                          {locales.route.confirmation.title}
                        </Modal.Title>
                        <Modal.Section>
                          {locales.route.confirmation.description}
                        </Modal.Section>
                        <Modal.SubmitButton
                          form={`remove-admin-form-${admin.id}`}
                          level="negative"
                        >
                          {locales.route.confirmation.confirm}
                        </Modal.SubmitButton>
                        <Modal.CloseButton route={location.pathname}>
                          {locales.route.confirmation.abort}
                        </Modal.CloseButton>
                      </Modal>
                    </>
                  ) : (
                    <Form
                      id={`remove-admin-form-${admin.id}`}
                      method="POST"
                      preventScrollReset
                    >
                      <input type="hidden" name="adminId" value={admin.id} />
                      <Button type="submit" variant="outline">
                        {locales.route.list.remove}
                      </Button>
                    </Form>
                  )}
                </ListItemPersonOrg.Controls>
              )}
            </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default AdminsList;
