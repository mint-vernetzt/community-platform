import {
  Link,
  type LoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
} from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import { getEventBySlug } from "./detail.server";

import { Button } from "@mint-vernetzt/components/src/molecules/Button"; // refactor?
import BackButton from "~/components/next/BackButton";
import BasicStructure from "~/components/next/BasicStructure";
import BreadCrump from "~/components/next/BreadCrump";
import EventsOverview from "~/components/next/EventsOverview";
import TabBar from "~/components/next/TabBar";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { getPublicURL } from "~/storage.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, "next_event");
  if (abilities.next_event.hasAccess === false) {
    return redirect("/");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/detail"];

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });

  const event = await getEventBySlug(params.slug);

  invariantResponse(event !== null, "event not found", { status: 404 });

  let blurredBackground;
  let background = event.background;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    if (publicURL) {
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.Detail.Background.width,
          height: ImageSizes.Event.Detail.Background.height,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.Detail.BlurredBackground.width,
          height: ImageSizes.Event.Detail.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    }
  } else {
    background = DefaultImages.Event.Background;
    blurredBackground = DefaultImages.Event.BlurredBackground;
  }

  const responsibleOrganizations = event.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.EventDetailResponsibleOrganization
                .Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.EventDetailResponsibleOrganization
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...relation.organization,
        logo,
        blurredLogo,
      };
    }
  );

  const enhancedEvent = {
    ...event,
    background,
    blurredBackground,
    responsibleOrganizations,
  };

  return {
    event: enhancedEvent,
    locales,
    language,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
    },
  };
}

function Detail() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const { pathname } = location;

  return (
    <BasicStructure>
      {loaderData.event.parentEvent !== null ? (
        <BreadCrump>
          <BreadCrump.Link
            to={`/next/event/${loaderData.event.parentEvent.slug}/detail/about`}
            prefetch="intent"
          >
            {loaderData.event.parentEvent.name}
          </BreadCrump.Link>
          <BreadCrump.Current>{loaderData.event.name}</BreadCrump.Current>
        </BreadCrump>
      ) : (
        <BackButton to="/explore/events" prefetch="intent">
          {loaderData.locales.route.content.back}
        </BackButton>
      )}
      <EventsOverview>
        <EventsOverview.Image
          alt={loaderData.event.name}
          src={loaderData.event.background}
          blurredSrc={loaderData.event.blurredBackground}
        />
        <EventsOverview.Container>
          <EventsOverview.EventName>
            {loaderData.event.name}
          </EventsOverview.EventName>

          <EventsOverview.InfoContainer>
            <EventsOverview.ResponsibleOrganizations
              organizations={loaderData.event.responsibleOrganizations}
              locales={loaderData.locales}
            />
            <EventsOverview.PeriodOfTime
              startTime={loaderData.event.startTime}
              endTime={loaderData.event.endTime}
              language={loaderData.language}
            />
            {loaderData.event.stage !== null && (
              <EventsOverview.Stage
                venueName={loaderData.event.venueName}
                venueStreet={loaderData.event.venueStreet}
                venueStreetNumber={loaderData.event.venueStreetNumber}
                venueZipCode={loaderData.event.venueZipCode}
                venueCity={loaderData.event.venueCity}
                stage={
                  loaderData.event.stage
                    .slug as keyof typeof loaderData.locales.stages
                }
                locales={loaderData.locales}
              />
            )}
            <EventsOverview.FreeSeats
              participantLimit={loaderData.event.participantLimit}
              participantsCount={loaderData.event._count.participants}
              locales={loaderData.locales}
            />
          </EventsOverview.InfoContainer>
          <EventsOverview.ButtonStates>
            <EventsOverview.SquareButton
              baseUrl={loaderData.meta.baseUrl}
              overlayMenuId="event-overview-more"
            >
              <EventsOverview.SquareButton.CopyURLToClipboard // naming?
                locales={loaderData.locales.route.content}
              />
            </EventsOverview.SquareButton>

            <div className="flex-grow md:flex-grow-0">
              <Button fullSize>Teilnehmen</Button>
            </div>
          </EventsOverview.ButtonStates>
        </EventsOverview.Container>
      </EventsOverview>
      <BasicStructure.Container>
        <TabBar>
          <TabBar.Item active={pathname.endsWith("/about")}>
            <Link to="./about" preventScrollReset>
              <TabBar.Item.Title>
                {loaderData.locales.route.content.details}
              </TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          {loaderData.event._count.participants > 0 && (
            <TabBar.Item active={pathname.endsWith("/participants")}>
              <Link
                to="./participants"
                preventScrollReset
                {...TabBar.getItemElementsContainerClasses()}
              >
                <TabBar.Item.Title>
                  {loaderData.locales.route.content.participants}
                </TabBar.Item.Title>
                <TabBar.Item.Counter>
                  {loaderData.event._count.participants}
                </TabBar.Item.Counter>
              </Link>
            </TabBar.Item>
          )}
          {loaderData.event._count.childEvents > 0 && (
            <TabBar.Item active={pathname.endsWith("/child-events")}>
              <Link
                to="./child-events"
                preventScrollReset
                {...TabBar.getItemElementsContainerClasses()}
              >
                <TabBar.Item.Title>
                  {loaderData.locales.route.content.childEvents}
                </TabBar.Item.Title>
                <TabBar.Item.Counter>
                  {loaderData.event._count.childEvents}
                </TabBar.Item.Counter>
              </Link>
            </TabBar.Item>
          )}
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </BasicStructure>
  );
}

export default Detail;
