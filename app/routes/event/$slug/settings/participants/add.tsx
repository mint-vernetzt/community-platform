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
import Hint from "~/components/next/Hint";
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
import { redirectWithToast } from "~/toast.server";
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
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/participants/add"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.published === false || event.external) {
    const deep = searchParams.get(Deep);
    return redirect(`../../time-period?${Deep}=${deep}`);
  }

  const { result: searchedProfiles } = await searchProfiles({
    eventId: event.id,
    authClient,
    searchParams,
    locales: locales.route.search,
  });

  return {
    locales,
    searchedProfiles,
    event,
    userId: sessionUser.id,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

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
    languageModuleMap[language]["event/$slug/settings/participants/add"];

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

  invariantResponse(
    event.published &&
      event.external === false &&
      (event._count.childEvents === 0 || event.parentParticipationRequired),
    "Forbidden",
    {
      status: 403,
    }
  );

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
  const { locales, event, userId } = loaderData;

  const [searchParams] = useSearchParams();
  const searchParticipantsParam = searchParams.get(
    SEARCH_PARTICIPANTS_SEARCH_PARAM
  );

  const fetcher = useFetcher<typeof loader>();

  const [form, fields] = useForm({
    id: "search-participants-form",
    defaultValue: {
      [SEARCH_PARTICIPANTS_SEARCH_PARAM]:
        searchParticipantsParam !== null ? searchParticipantsParam : "",
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

  const [
    participationLinkCopiedToClipboard,
    setParticipationLinkCopiedToClipboard,
  ] = useState(false);
  useEffect(() => {
    if (participationLinkCopiedToClipboard) {
      const timer = setTimeout(() => {
        setParticipationLinkCopiedToClipboard(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [participationLinkCopiedToClipboard]);
  const handleCopyToClipboard = (text: string, type: "participationLink") => {
    void navigator.clipboard.writeText(text);
    if (type === "participationLink") {
      setParticipationLinkCopiedToClipboard(true);
    }
  };

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>{locales.route.title}</TitleSection.Headline>
        <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
      </TitleSection>
      {event.participationLink !== null && (
        <>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.participationLinkHint}
          </Hint>
          <div className="flex items-center justify-between py-3 px-4 bg-neutral-100 rounded-lg">
            <div className="flex gap-4 items-center overflow-hidden">
              <span className="truncate">{event.participationLink}</span>
            </div>
            <div>
              {participationLinkCopiedToClipboard ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M13.8536 3.64645C14.0488 3.84171 14.0488 4.15829 13.8536 4.35355L6.85355 11.3536C6.75979 11.4473 6.63261 11.5 6.5 11.5C6.36739 11.5 6.24021 11.4473 6.14645 11.3536L2.64645 7.85355C2.45118 7.65829 2.45118 7.34171 2.64645 7.14645C2.84171 6.95118 3.15829 6.95118 3.35355 7.14645L6.5 10.2929L13.1464 3.64645C13.3417 3.45118 13.6583 3.45118 13.8536 3.64645Z"
                    fill="#3C4658"
                  />
                </svg>
              ) : (
                <button
                  onClick={() => {
                    handleCopyToClipboard(
                      event.participationLink as string, // This is safe because we only render this button if participationLink is not null
                      "participationLink"
                    );
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13 0H6C4.89543 0 4 0.89543 4 2C2.89543 2 2 2.89543 2 4V14C2 15.1046 2.89543 16 4 16H11C12.1046 16 13 15.1046 13 14C14.1046 14 15 13.1046 15 12V2C15 0.89543 14.1046 0 13 0ZM13 13V4C13 2.89543 12.1046 2 11 2H5C5 1.44772 5.44772 1 6 1H13C13.5523 1 14 1.44772 14 2V12C14 12.5523 13.5523 13 13 13ZM3 4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V4Z"
                      fill="#3C4658"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {event.parentEvent !== null &&
      event.parentEvent.parentParticipationRequired &&
      event.parentParticipationRequired !== false &&
      event.parentEvent.admins.some(
        (relation) => relation.profileId === userId
      ) === false ? (
        <Hint>
          <Hint.InfoIcon />
          {locales.route.parentParticipationRequiredHint}
        </Hint>
      ) : event._count.childEvents > 0 &&
        event.parentParticipationRequired === false ? (
        <Hint>
          <Hint.InfoIcon />
          {locales.route.participationOnChildEventsRequiredHint}
        </Hint>
      ) : (
        <>
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
              <Input.Label
                htmlFor={fields[SEARCH_PARTICIPANTS_SEARCH_PARAM].id}
              >
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
                      <ListItemPersonOrg.Avatar
                        size="full"
                        {...searchedProfile}
                      />
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
      )}
    </>
  );
}

export default ParticipantsAdd;
