import {
  type LoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
} from "react-router";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import { getEventBySlug } from "./detail.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import BasicStructure from "~/components/next/BasicStructure";
import BackButton from "~/components/next/BackButton";
import SectionDetailHeader from "~/components/next/SectionDetailHeader";
import SectionDetailHeaderEventImage from "~/components/next/SectionDetailHeaderEventImage";
import BreadCrump from "~/components/next/BreadCrump";

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
      <SectionDetailHeader>
        <SectionDetailHeaderEventImage>
          <Image
            alt={loaderData.event.name}
            src={loaderData.event.background}
            blurredSrc={loaderData.event.blurredBackground}
            resizeType="fit"
          />
        </SectionDetailHeaderEventImage>
        <SectionDetailHeader.Content>
          {loaderData.event.name}
        </SectionDetailHeader.Content>
      </SectionDetailHeader>
      <Outlet />
    </BasicStructure>
  );
}

export default Detail;
