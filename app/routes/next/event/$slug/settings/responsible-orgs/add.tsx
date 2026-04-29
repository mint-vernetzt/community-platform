import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useFetcher,
  useLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  addOwnOrganizationToEvent,
  getEventBySlug,
  getOwnOrganizationsOfEvent,
  inviteOrganizationToBeResponsibleForEvent,
  searchOrganizations,
} from "./add.server";
import {
  ADD_OWN_ORGANIZATION_INTENT,
  createAddOwnOrganizationSchema,
  createInviteOrganizationSchema,
  createSearchOrganizationsSchema,
  createSearchOwnOrganizationsSchema,
  INVITE_ORGANIZATION_INTENT,
  ORGANIZATION_ID_FIELD,
  SEARCH_ORGANIZATIONS_SEARCH_PARAM,
  SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM,
} from "./add.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/add"
    ];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "event not found", {
    status: 404,
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

  invariantResponse(sessionUser !== null, "Unauthorized", { status: 401 }); // Needed for type narrowing

  const { result: searchedOrganizations } = await searchOrganizations({
    eventId: event.id,
    request,
    locales: locales.route.search,
    authClient,
  });

  const {
    result: ownOrganizations,
    submission: ownOrganizationsSearchSubmission,
  } = await getOwnOrganizationsOfEvent({
    eventId: event.id,
    userId: sessionUser.id,
    request,
    locales: locales.route.ownOrganizations.search,
    authClient,
  });

  return {
    locales,
    searchedOrganizations,
    ownOrganizations,
    ownOrganizationsSearchSubmission,
  };
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
      "next/event/$slug/settings/responsible-orgs/add"
    ];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === INVITE_ORGANIZATION_INTENT ||
      intent === ADD_OWN_ORGANIZATION_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (intent === INVITE_ORGANIZATION_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createInviteOrganizationSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await inviteOrganizationToBeResponsibleForEvent({
        eventId: event.id,
        organizationId: submission.value[ORGANIZATION_ID_FIELD],
        userId: sessionUser.id,
        locales: locales.route,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "invite-responsible-organization-error",
        key: `invite-responsible-organization-error-${Date.now()}`,
        message: locales.route.errors.inviteResponsibleOrganization,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "invite-responsible-organization-success",
      key: `invite-responsible-organization-success-${Date.now()}`,
      message: locales.route.success.inviteResponsibleOrganization,
      level: "positive",
    });
  } else {
    const submission = await parseWithZod(formData, {
      schema: createAddOwnOrganizationSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await addOwnOrganizationToEvent({
        eventId: event.id,
        organizationId: submission.value[ORGANIZATION_ID_FIELD],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "add-own-organization-error",
        key: `add-own-organization-error-${Date.now()}`,
        message: locales.route.errors.addOwnOrganization,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "add-own-organization-success",
      key: `add-own-organization-success-${Date.now()}`,
      message: locales.route.success.addOwnOrganization,
      level: "positive",
    });
  }
}

function AddResponsibleOrg() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const [searchParams] = useSearchParams();
  const searchOrganizationsParam = searchParams.get(
    SEARCH_ORGANIZATIONS_SEARCH_PARAM
  );

  const searchFetcher = useFetcher<typeof loader>();
  const [searchForm, searchFields] = useForm({
    id: "search-responsible-orgs-form",
    defaultValue: {
      [SEARCH_ORGANIZATIONS_SEARCH_PARAM]:
        searchOrganizationsParam !== null ? searchOrganizationsParam : "",
    },
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createSearchOrganizationsSchema(locales.route.search),
      });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
  });

  const handleChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    searchForm.validate();
    if (searchForm.valid) {
      void searchFetcher.submit(event.currentTarget, {
        preventScrollReset: true,
      });
    }
  };

  const searchedOrganizations =
    typeof searchFetcher.data !== "undefined"
      ? searchFetcher.data.searchedOrganizations
      : loaderData.searchedOrganizations;

  const [ownOrganizations, setOwnOrganizations] = useState(
    loaderData.ownOrganizations
  );

  useEffect(() => {
    setOwnOrganizations(loaderData.ownOrganizations);
  }, [loaderData.ownOrganizations]);

  return (
    <>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.ownOrganizations.title}
        </h3>
        <p>{locales.route.ownOrganizations.instruction}</p>
      </div>
      <List
        locales={locales.route.ownOrganizations.list}
        id="admins-list"
        hideAfter={1}
      >
        <List.Search
          defaultItems={loaderData.ownOrganizations}
          setValues={setOwnOrganizations}
          searchParam={SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.ownOrganizations.search.placeholder,
            label: locales.route.ownOrganizations.search.label,
          }}
          label={locales.route.ownOrganizations.search.label}
          submission={loaderData.ownOrganizationsSearchSubmission}
          schema={createSearchOwnOrganizationsSchema(
            locales.route.ownOrganizations.search
          )}
          hideLabel={false}
        />
        {ownOrganizations.map((ownOrganization, index) => {
          return (
            <ListItemPersonOrg key={ownOrganization.id} index={index}>
              <ListItemPersonOrg.Avatar size="full" {...ownOrganization} />
              <ListItemPersonOrg.Headline>
                {ownOrganization.name}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Controls>
                {ownOrganization.alreadyResponsibleOrganization ? (
                  <p className="text-sm font-semibold text-positive-600">
                    {locales.route.search.alreadyResponsibleOrganization}
                  </p>
                ) : ownOrganization.alreadyInvited ? (
                  <p className="text-sm font-semibold text-neutral-700">
                    {locales.route.search.alreadyInvited}
                  </p>
                ) : (
                  <Form
                    id={`add-own-organization-${ownOrganization.id}`}
                    method="post"
                    preventScrollReset
                  >
                    <Input
                      type="hidden"
                      name={ORGANIZATION_ID_FIELD}
                      value={ownOrganization.id}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      name={INTENT_FIELD_NAME}
                      value={ADD_OWN_ORGANIZATION_INTENT}
                    >
                      {locales.route.ownOrganizations.list.add}
                    </Button>
                  </Form>
                )}
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.search.title}
        </h3>
        <p>{locales.route.search.explanation}</p>
      </div>
      <searchFetcher.Form
        {...getFormProps(searchForm)}
        method="get"
        autoComplete="off"
        onChange={handleChange}
      >
        <Input name={Deep} defaultValue="true" type="hidden" />
        <Input
          {...getInputProps(searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM], {
            type: "text",
          })}
          placeholder={locales.route.search.placeholder}
          key={searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].id}
          standalone
        >
          <Input.Label
            htmlFor={searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].id}
          >
            {locales.route.search.label}
          </Input.Label>
          <Input.SearchIcon />
          <Input.ClearIcon
            onClick={() => {
              searchForm.reset();
              void searchFetcher.submit(null, { preventScrollReset: true });
            }}
          />

          {typeof searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].errors !==
            "undefined" &&
          searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].errors.length > 0 ? (
            searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].errors.map(
              (error) => (
                <Input.Error
                  id={searchFields[SEARCH_ORGANIZATIONS_SEARCH_PARAM].errorId}
                  key={error}
                >
                  {error}
                </Input.Error>
              )
            )
          ) : (
            <Input.HelperText>{locales.route.search.hint}</Input.HelperText>
          )}
          <Input.Controls>
            <noscript>
              <Button type="submit" variant="outline">
                {locales.route.search.submit}
              </Button>
            </noscript>
          </Input.Controls>
        </Input>
        {typeof searchForm.errors !== "undefined" &&
        searchForm.errors.length > 0 ? (
          <div>
            {searchForm.errors.map((error, index) => {
              return (
                <div
                  id={searchForm.errorId}
                  key={index}
                  className="text-sm font-semibold text-negative-700"
                >
                  {error}
                </div>
              );
            })}
          </div>
        ) : null}
      </searchFetcher.Form>
      {searchedOrganizations.length > 0 && (
        <>
          <p className="text-sm text-neutral-700 font-semibold text-center">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.search.result_one,
                locales.route.search.result_other,
                searchedOrganizations.length
              ),
              { count: searchedOrganizations.length }
            )}
          </p>
          <List
            locales={locales.route.search}
            id="admin-search-results"
            hideAfter={4}
          >
            {searchedOrganizations.map((searchedOrganization, index) => {
              return (
                <ListItemPersonOrg key={searchedOrganization.id} index={index}>
                  <ListItemPersonOrg.Avatar
                    size="full"
                    {...searchedOrganization}
                  />
                  <ListItemPersonOrg.Headline>
                    {searchedOrganization.name}
                  </ListItemPersonOrg.Headline>
                  <ListItemPersonOrg.Controls>
                    {searchedOrganization.alreadyResponsibleOrganization ? (
                      <p className="text-sm font-semibold text-positive-600">
                        {locales.route.search.alreadyResponsibleOrganization}
                      </p>
                    ) : searchedOrganization.alreadyInvited ? (
                      <p className="text-sm font-semibold text-neutral-700">
                        {locales.route.search.alreadyInvited}
                      </p>
                    ) : (
                      <Form
                        id={`invite-organization-to-join-event-as-responsible-org-${searchedOrganization.id}`}
                        method="post"
                        preventScrollReset
                      >
                        <Input
                          type="hidden"
                          name={ORGANIZATION_ID_FIELD}
                          value={searchedOrganization.id}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={INVITE_ORGANIZATION_INTENT}
                        >
                          {locales.route.search.invite}
                        </Button>
                      </Form>
                    )}
                  </ListItemPersonOrg.Controls>
                </ListItemPersonOrg>
              );
            })}
          </List>
        </>
      )}
    </>
  );
}

export default AddResponsibleOrg;
