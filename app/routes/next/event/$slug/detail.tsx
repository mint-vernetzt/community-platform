import {
  type LoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
} from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import { getEventBySlug } from "./detail.server";

import BackButton from "~/components/next/BackButton";
import BasicStructure from "~/components/next/BasicStructure";
import BreadCrump from "~/components/next/BreadCrump";
import EventsOverview from "~/components/next/EventsOverview";
import Image from "~/components/next/Image";
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

  const enhancedEvent = { ...event, background, blurredBackground };

  return { event: enhancedEvent, locales };
}

function Detail() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <BasicStructure>
      {loaderData.event.parentEvent !== null ? (
        <BreadCrump>
          <BreadCrump.Link to={`/event/${loaderData.event.parentEvent.slug}`}>
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
        <div className="relative overflow-hidden h-[186px] sm:h-[400px] aspect-[31/10]">
          <Image
            alt={loaderData.event.name}
            src={loaderData.event.background}
            blurredSrc={loaderData.event.blurredBackground}
            resizeType="fit"
          />
        </div>
        <EventsOverview.Container>
          <div className="flex flex-col gap-2 sm:gap-4">
            <EventsOverview.EventName>
              {loaderData.event.name}
            </EventsOverview.EventName>
            <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex flex-col gap-2 sm:gap-4 min-w-1/2">
                <div className="">Name der Organisation</div>
                <div className="">30. Sept. – 02. Okt. 2025</div>
              </div>
              <div className="flex flex-col gap-2 sm:gap-4 min-w-1/2">
                <div className="order-last sm:order-none">7/10 Plätze frei</div>
                <div className="">VDI - GARAGE GGMBH</div>
              </div>
            </div>
          </div>
          <div className="">Button</div>
        </EventsOverview.Container>
      </EventsOverview>
      <Outlet />
    </BasicStructure>
  );
}

export default Detail;
