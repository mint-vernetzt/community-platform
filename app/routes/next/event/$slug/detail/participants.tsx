import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useState } from "react";
import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getParticipantsOfEvent } from "./participants.server";
import { SEARCH_PARTICIPANTS_SEARCH_PARAM } from "./participants.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/detail/participants"];

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${encodeURIComponent(request.url)}`);
  }

  const { slug } = params;

  invariantResponse(typeof slug !== "undefined", "slug not found", {
    status: 400,
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, participants } = await getParticipantsOfEvent({
    slug,
    authClient,
    sessionUser,
    searchParams,
  });

  return { submission, participants, locales };
}

function Participants() {
  const loaderData = useLoaderData<typeof loader>();

  const [participants, setParticipants] = useState(loaderData.participants);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-neutral-700 text-xl font-bold leading-6">
        {loaderData.locales.route.content.title}
      </h3>
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
        >
          <Input name={Deep} defaultValue="true" type="hidden" />
        </List.Search>
        {participants.map((participant, index) => {
          return (
            <ListItemPersonOrg
              key={participant.id}
              index={index}
              to={`/profile/${participant.username}`}
            >
              <ListItemPersonOrg.Avatar size="full" {...participant} />
              <ListItemPersonOrg.Headline>
                {participant.academicTitle !== null &&
                participant.academicTitle.length > 0
                  ? `${participant.academicTitle} `
                  : ""}
                {participant.firstName} {participant.lastName}
              </ListItemPersonOrg.Headline>
              {participant.position !== null ? (
                <ListItemPersonOrg.Subline>
                  {participant.position}
                </ListItemPersonOrg.Subline>
              ) : null}
            </ListItemPersonOrg>
          );
        })}
      </List>
    </div>
  );
}

export default Participants;
