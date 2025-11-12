import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/legacy/Richtext/RichText";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getChildEventsOfEvent } from "./child-events.server";
import { hasDescription, hasSubline } from "./child-events.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const { slug } = params;
  invariantResponse(typeof slug !== "undefined", "slug not found", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/detail/child-events"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, childEvents } = await getChildEventsOfEvent({
    slug,
    authClient,
    sessionUser,
    searchParams,
  });

  return { submission, childEvents, locales, language };
}

function ChildEvents() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-neutral-700 text-xl font-bold leading-6">
        {loaderData.locales.route.content.title}
      </h3>
      <List
        id="child-events-list"
        hideAfter={10}
        locales={loaderData.locales.route.content}
      >
        {loaderData.childEvents.map((event, index) => {
          console.log(event.name, event.mode, event.isMember);
          return (
            <ListItemEvent
              key={event.id}
              index={index}
              to={`/event/${event.slug}`}
            >
              <ListItemEvent.Image
                alt={event.name}
                src={event.background}
                blurredSrc={event.blurredBackground}
              />
              <ListItemEvent.Info
                {...event}
                stage={event.stage}
                locales={{
                  stages: loaderData.locales.stages,
                  ...loaderData.locales.route.content,
                }}
                language={loaderData.language}
              ></ListItemEvent.Info>
              <ListItemEvent.Headline>{event.name}</ListItemEvent.Headline>
              {hasSubline(event) || hasDescription(event) ? (
                <ListItemEvent.Subline>
                  {hasSubline(event) ? (
                    event.subline
                  ) : (
                    <RichText html={event.description as string} />
                  )}
                </ListItemEvent.Subline>
              ) : null}
              {/* No condition needed here, because unpublished events are filtered out server-side */}
              <ListItemEvent.Flag
                canceled={event.canceled}
                published={event.published}
              />
              {event.mode === "canParticipate" ||
              event.mode === "participating" ||
              event.mode === "canWait" ||
              event.mode === "waiting" ? (
                <ListItemEvent.Control
                  eventId={event.id}
                  mode={event.mode}
                  locales={{ ...loaderData.locales.route.content }}
                />
              ) : null}
            </ListItemEvent>
          );
        })}
      </List>
    </div>
  );
}

export default ChildEvents;
