import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventBySlug,
  getResponsibleOrgsOfEvent,
  removeResponsibleOrgFromEvent,
} from "./list.server";
import {
  getRemoveResponsibleOrgSchema,
  getSearchResponsibleOrgsSchema,
  SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM,
} from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/list"
    ];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, responsibleOrgs } = await getResponsibleOrgsOfEvent({
    slug: params.slug,
    authClient,
    searchParams,
  });

  if (responsibleOrgs.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/responsible-orgs/add`);
  }

  return { locales, submission, responsibleOrgs };
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
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/list"
    ];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: getRemoveResponsibleOrgSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await removeResponsibleOrgFromEvent({
      responsibleOrgId: submission.value.responsibleOrgId,
      eventId: event.id,
      userId: sessionUser.id,
      locales: locales.route,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "remove-responsible-org-error",
      key: `remove-responsible-org-error-${Date.now()}`,
      message: locales.route.errors.removeResponsibleOrgFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "remove-responsible-org-success",
    key: `remove-responsible-org-success-${Date.now()}`,
    message: locales.route.success.removeResponsibleOrg,
    level: "positive",
  });
}

function ResponsibleOrgsList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;
  const [responsibleOrgs, setResponsibleOrgs] = useState(
    loaderData.responsibleOrgs
  );

  useEffect(() => {
    setResponsibleOrgs(loaderData.responsibleOrgs);
  }, [loaderData.responsibleOrgs]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List
        id="responsible-orgs-list"
        hideAfter={4}
        locales={locales.route.list}
      >
        <List.Search
          defaultItems={loaderData.responsibleOrgs}
          setValues={setResponsibleOrgs}
          searchParam={SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchResponsibleOrgsSchema()}
        />
        {responsibleOrgs.map((responsibleOrg, index) => {
          return (
            <ListItemPersonOrg
              key={responsibleOrg.id}
              index={index}
              //to={`/organization/${responsibleOrg.slug}/detail/about`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...responsibleOrg} />
              <ListItemPersonOrg.Headline>
                {responsibleOrg.name}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Controls>
                <Form
                  id={`remove-responsible-org-form-${responsibleOrg.id}`}
                  method="POST"
                  preventScrollReset
                >
                  <input
                    type="hidden"
                    name="responsibleOrgId"
                    value={responsibleOrg.id}
                  />
                  <Button type="submit" variant="outline">
                    {locales.route.list.remove}
                  </Button>
                </Form>
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default ResponsibleOrgsList;
