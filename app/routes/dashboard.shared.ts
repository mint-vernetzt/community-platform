import { type useLoaderData } from "react-router";
import { type loader } from "./dashboard";
import { type TeaserIconType } from "~/components-next/TeaserCard";
import { type AtLeastOne } from "~/lib/utils/types";

export function getDataForUpdateTeasers() {
  type UpdateTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["route"]["content"]["updateTeasers"]["entries"];
  type UpdateTeaser = {
    [key in UpdateTeaserKey]: {
      link: string;
      icon: TeaserIconType;
      external: boolean;
    };
  };
  const teaserData: AtLeastOne<UpdateTeaser> = {
    resources: {
      link: "/resources",
      icon: "box-seam",
      external: false,
    },
    mapView: {
      link: "/explore/organizations/map",
      icon: "globe",
      external: false,
    },
  };
  return teaserData;
}

export function getDataForNewsTeasers() {
  type NewsTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["route"]["content"]["newsTeaser"]["entries"];
  type NewsTeaser = {
    [key in NewsTeaserKey]: {
      link: string;
      icon: TeaserIconType;
      external: boolean;
    };
  };
  const teaserData: AtLeastOne<NewsTeaser> = {
    tableMedia: {
      link: "https://table.media/aktion/mint-vernetzt?utm_source=samail&utm_medium=email&utm_campaign=rt_mintvernetzt_koop_email_job&utm_content=lp_1",
      icon: "lightning-charge",
      external: true,
    },
    annualConference: {
      link: "/event/mintvernetztjahrestagung2025-lxa5gke3/detail/about",
      icon: "megaphone",
      external: false,
    },
  };
  return teaserData;
}
