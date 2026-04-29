import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
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
  getEventIdBySlug,
  getInvitedOrganizations,
  revokeOrganizationInvite,
} from "./invites.server";
import {
  createRevokeOrganizationInviteSchema,
  INVITED_ORGANIZATIONS_SEARCH_PARAM,
  ORGANIZATION_ID_FIELD,
  createSearchInvitedOrganizationsSchema,
} from "./invites.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/invites"
    ];

  const eventId = await getEventIdBySlug(params.slug);
  invariantResponse(eventId !== null, "Event not found", { status: 404 });

  const { submission, organizations } = await getInvitedOrganizations({
    request,
    eventId,
    authClient,
    locales: locales.route.search,
  });

  if (organizations.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/responsible-orgs/add`);
  }

  return { locales, language, organizations, submission };
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

  const event = await getEventIdBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/invites"
    ];

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createRevokeOrganizationInviteSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await revokeOrganizationInvite({
      eventId: event,
      organizationId: submission.value[ORGANIZATION_ID_FIELD],
      userId: sessionUser.id,
      locales: {
        mail: locales.route.mail.cancelledInvitation,
      },
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "revoke-invite-error",
      key: `revoke-invite-error-${Date.now()}`,
      message: locales.route.errors.revokeInviteFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "revoke-invite-success",
    key: `revoke-invite-success-${Date.now()}`,
    message: locales.route.success.revokeInvite,
    level: "positive",
  });
}

function OrganizationInvites() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const [organizations, setOrganizations] = useState(loaderData.organizations);

  useEffect(() => {
    setOrganizations(loaderData.organizations);
  }, [loaderData.organizations]);
  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="invites-list" locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.organizations}
          setValues={setOrganizations}
          searchParam={INVITED_ORGANIZATIONS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.search.placeholder,
            label: locales.route.search.label,
          }}
          hideUntil={8}
          label={locales.route.search.label}
          submission={loaderData.submission}
          schema={createSearchInvitedOrganizationsSchema(locales.route.search)}
          hideLabel={false}
        />
        {organizations.map((organization, index) => {
          return (
            <ListItemPersonOrg
              key={organization.id}
              index={index}
              // to={`/organization/${organization.slug}/detail/about`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...organization} />
              <ListItemPersonOrg.Headline>
                {organization.name}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Subline>
                {insertParametersIntoLocale(locales.route.listItem.invitedAt, {
                  date: organization.invitedAt.toLocaleDateString(language, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  }),
                })}
              </ListItemPersonOrg.Subline>
              <ListItemPersonOrg.Controls>
                <Form
                  id={`revoke-invite-form-${organization.id}`}
                  method="post"
                  preventScrollReset
                >
                  <input
                    type="hidden"
                    name={ORGANIZATION_ID_FIELD}
                    value={organization.id}
                  />
                  <Button type="submit" variant="outline">
                    {locales.route.list.revoke}
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

export default OrganizationInvites;
