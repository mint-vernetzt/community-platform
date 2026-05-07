import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  Form,
  redirect,
  useFetcher,
  useLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import TitleSection from "~/components/next/TitleSection";
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
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventBySlug,
  inviteProfileToParticipateOnEvent,
  searchProfiles,
} from "./add.server";
import {
  createInviteProfileToParticipateOnEvent,
  createSearchParticipantsSchema,
  INVITE_PROFILE_PARTICIPATE_INTENT,
  PROFILE_ID,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./add.shared";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/participants/add"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const { authClient } = createAuthClient(request);

  const { result: searchedProfiles } = await searchProfiles({
    eventId: event.id,
    authClient,
    searchParams,
    locales: locales.route.search,
  });

  return {
    locales,
    searchedProfiles,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", {
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
    languageModuleMap[language]["next/event/$slug/settings/participants/add"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === INVITE_PROFILE_PARTICIPATE_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const submission = await parseWithZod(formData, {
    schema: createInviteProfileToParticipateOnEvent(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await inviteProfileToParticipateOnEvent({
      eventId: event.id,
      profileId: submission.value[PROFILE_ID],
      locales: locales.route,
    });
  } catch (error) {
    console.log("Error inviting profile to participate on event", error);
    captureException(error);
    return redirectWithToast(request.url, {
      id: "invite-profile-to-participate-on-event-error",
      key: `invite-profile-to-participate-on-event-error-${Date.now()}`,
      message: locales.route.errors.inviteProfileToParticipate,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "invite-profile-to-participate-on-event-success",
    key: `invite-profile-to-participate-on-event-success-${Date.now()}`,
    message: locales.route.success.inviteProfileToParticipate,
    level: "positive",
  });
}

function ParticipantsAdd() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const [searchParams] = useSearchParams();
  const searchSpeakersParam = searchParams.get(
    SEARCH_PARTICIPANTS_SEARCH_PARAM
  );

  const fetcher = useFetcher<typeof loader>();

  const [form, fields] = useForm({
    id: "search-participants-form",
    defaultValue: {
      [SEARCH_PARTICIPANTS_SEARCH_PARAM]:
        searchSpeakersParam !== null ? searchSpeakersParam : "",
    },
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createSearchParticipantsSchema(locales.route.search),
      });
      return submission;
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
  });

  const handleChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    form.validate();
    if (form.valid) {
      void fetcher.submit(event.currentTarget, {
        preventScrollReset: true,
      });
    }
  };

  const searchedProfiles =
    typeof fetcher.data !== "undefined"
      ? fetcher.data.searchedProfiles
      : loaderData.searchedProfiles;

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>{locales.route.title}</TitleSection.Headline>
        <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
      </TitleSection>
      <fetcher.Form
        {...getFormProps(form)}
        method="get"
        autoComplete="off"
        onChange={handleChange}
      >
        <Input name={Deep} defaultValue="true" type="hidden" />
        <Input
          {...getInputProps(fields[SEARCH_PARTICIPANTS_SEARCH_PARAM], {
            type: "text",
          })}
          placeholder={locales.route.search.placeholder}
          key={fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].id}
          standalone
        >
          <Input.Label htmlFor={fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].id}>
            {locales.route.search.label}
          </Input.Label>
          <Input.SearchIcon />
          <Input.ClearIcon
            onClick={() => {
              form.reset();
              void fetcher.submit(null, { preventScrollReset: true });
            }}
          />

          {typeof fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].errors !==
            "undefined" &&
          fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].errors.length > 0 ? (
            fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].errors.map((error) => (
              <Input.Error
                id={fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].errorId}
                key={error}
              >
                {error}
              </Input.Error>
            ))
          ) : (
            <Input.HelperText>
              {locales.route.search.helperText}
            </Input.HelperText>
          )}
          <Input.Controls>
            <noscript>
              <Button type="submit" variant="outline">
                {locales.route.search.submit}
              </Button>
            </noscript>
          </Input.Controls>
        </Input>
      </fetcher.Form>
      {searchedProfiles.length > 0 && (
        <>
          <p className="text-sm text-neutral-700 font-semibold text-center">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.search.result_one,
                locales.route.search.result_other,
                searchedProfiles.length
              ),
              { count: searchedProfiles.length }
            )}
          </p>
          <List
            locales={locales.route.list}
            id="searched-profiles"
            hideAfter={4}
          >
            {searchedProfiles.map((searchedProfile, index) => {
              return (
                <ListItemPersonOrg key={searchedProfile.id} index={index}>
                  <ListItemPersonOrg.Avatar size="full" {...searchedProfile} />
                  <ListItemPersonOrg.Headline>
                    {searchedProfile.academicTitle !== null &&
                    searchedProfile.academicTitle.length > 0
                      ? `${searchedProfile.academicTitle} `
                      : ""}
                    {searchedProfile.firstName} {searchedProfile.lastName}
                  </ListItemPersonOrg.Headline>
                  <ListItemPersonOrg.Controls>
                    {searchedProfile.alreadyParticipant ? (
                      <p className="text-sm font-semibold text-positive-600">
                        {locales.route.list.item.alreadyParticipant}
                      </p>
                    ) : searchedProfile.alreadyInvited ? (
                      <p className="text-sm font-semibold text-neutral-700">
                        {locales.route.list.item.alreadyInvited}
                      </p>
                    ) : (
                      <Form
                        id={`invite-profile-to-join-participant-on-event-${searchedProfile.id}`}
                        method="post"
                        preventScrollReset
                      >
                        <Input
                          type="hidden"
                          name={PROFILE_ID}
                          value={searchedProfile.id}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={INVITE_PROFILE_PARTICIPATE_INTENT}
                        >
                          {locales.route.list.item.invite}
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

export default ParticipantsAdd;
