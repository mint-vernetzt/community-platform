import { useState } from "react";
import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import HeadlineContainer from "~/components/next/HeadlineContainer";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getChildEventCount } from "../utils.server";
import {
  getFullDepthParticipantIds,
  getParticipantsOfEvent,
} from "./participants.server";
import {
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";
import { hasContent } from "~/utils.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/detail/participants"];

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${encodeURIComponent(request.url)}`);
  }

  const { slug } = params;

  invariantResponse(typeof slug !== "undefined", "slug not found", {
    status: 400,
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const childEventCount = await getChildEventCount(slug);
  let optionalWhereClause;
  if (childEventCount > 0) {
    const participantIds = await getFullDepthParticipantIds(slug);
    optionalWhereClause = {
      id: {
        in: participantIds,
      },
    };
  }

  const { submission, participants } = await getParticipantsOfEvent({
    slug,
    authClient,
    sessionUser,
    searchParams,
    optionalWhereClause,
  });

  return { submission, participants, locales };
}

function Participants() {
  const loaderData = useLoaderData<typeof loader>();

  const [participants, setParticipants] = useState(loaderData.participants);

  return (
    <div className="flex flex-col gap-4">
      <HeadlineContainer as="h3">
        {loaderData.locales.route.content.title}
      </HeadlineContainer>
      <List
        id="participants-list"
        hideAfter={10}
        locales={loaderData.locales.route.content}
        multiColumnAt="md"
      >
        <List.Search
          defaultItems={loaderData.participants}
          setValues={setParticipants}
          searchParam={SEARCH_PARTICIPANTS_SEARCH_PARAM}
          locales={{
            placeholder: loaderData.locales.route.content.searchPlaceholder,
          }}
          hideUntil={10}
          label={loaderData.locales.route.content.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchParticipantsSchema()}
        />
        {participants.map((participant, index) => {
          return (
            <ListItemPersonOrg
              key={participant.id}
              index={index}
              to={`/profile/${participant.username}`}
            >
              <ListItemPersonOrg.Avatar size="full" {...participant} />
              <ListItemPersonOrg.Headline>
                {hasContent(participant.academicTitle)
                  ? `${participant.academicTitle} `
                  : ""}
                {participant.firstName} {participant.lastName}
              </ListItemPersonOrg.Headline>
              {hasContent(participant.position) && (
                <ListItemPersonOrg.Subline>
                  {participant.position}
                </ListItemPersonOrg.Subline>
              )}
            </ListItemPersonOrg>
          );
        })}
      </List>
    </div>
  );
}

export default Participants;
