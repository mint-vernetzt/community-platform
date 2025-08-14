import { type Organization } from "@prisma/client";
import maplibreGL from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { type MapLocales } from "~/routes/map.server";
import { ListItem, type ListOrganization } from "./ListItem";
import { BurgerMenuOpen } from "./icons/BurgerMenuOpen";
import { Link, useSearchParams } from "react-router";
import { BurgerMenuClosed } from "./icons/BurgerMenuClosed";
import { CloseX } from "./icons/CloseX";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";

type MapOrganization = ListOrganization &
  Pick<
    Organization,
    "longitude" | "latitude" | "street" | "streetNumber" | "zipCode" | "city"
  >;

export function Map(props: {
  organizations: Array<MapOrganization>;
  locales: MapLocales;
}) {
  const { organizations, locales } = props;
  const [searchParams] = useSearchParams();

  const [mapMenuIsOpen, setMapMenuIsOpen] = useState(
    searchParams.get("openMapMenu") === "true"
  );

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibreGL.Map | null>(null);

  useEffect(() => {
    if (mapRef.current === null && mapContainer.current !== null) {
      const center = [10.451526, 51.165691] as [number, number];
      const maxBounds = [
        [-2, 46],
        [22, 56],
      ] as [[number, number], [number, number]];
      const zoom = 0;
      const minZoom = 5.2;
      const maxZoom = 12;
      // eslint-disable-next-line import/no-named-as-default-member
      mapRef.current = new maplibreGL.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
        minZoom,
        maxZoom,
        maxBounds,
      });
      mapRef.current.addControl(
        // eslint-disable-next-line import/no-named-as-default-member
        new maplibreGL.NavigationControl({
          visualizePitch: true,
          visualizeRoll: true,
          showZoom: true,
          showCompass: false,
        })
      );
      for (const organization of organizations) {
        if (organization.longitude === null || organization.latitude === null) {
          continue;
        }
        // eslint-disable-next-line import/no-named-as-default-member
        const popup = new maplibreGL.Popup({
          offset: 25,
        }).setHTML(
          renderToStaticMarkup(
            <Popup organization={organization} locales={locales} />
          )
        );

        // eslint-disable-next-line import/no-named-as-default-member
        new maplibreGL.Marker()
          .setLngLat([
            parseFloat(organization.longitude),
            parseFloat(organization.latitude),
          ])
          .setPopup(popup)
          .addTo(mapRef.current);
      }
    }
  }, [mapContainer, organizations, locales]);

  return (
    <>
      <div
        ref={mapContainer}
        className={`mv-absolute mv-w-full mv-h-full mv-rounded-2xl mv-overflow-hidden ${
          mapMenuIsOpen === true
            ? "mv-w-[calc(100vw-336px)] mv-left-[336px]"
            : "mv-w-full"
        }`}
      />
      {organizations.length > 0 ? (
        <div
          className={`mv-absolute mv-top-0 mv-bottom-0 mv-left-0 mv-rounded-l-2xl mv-w-fit md:mv-w-[336px] mv-overflow-y-auto mv-pointer-events-none mv-z-10 ${
            mapMenuIsOpen === true
              ? "mv-w-screen md:mv-w-[336px]"
              : "mv-w-fit md:mv-w-[336px]"
          }`}
        >
          <div
            className={`mv-flex mv-flex-col mv-gap-6 mv-p-4 mv-bg-white mv-border-r mv-border-neutral-200 mv-w-full mv-pointer-events-auto ${
              mapMenuIsOpen === true
                ? "mv-min-h-full mv-rounded-l-2xl"
                : "mv-rounded-br-2xl mv-rounded-tl-2xl"
            }`}
          >
            <div className="mv-flex mv-items-center mv-gap-2.5">
              <p
                className={`${
                  mapMenuIsOpen === true ? "mv-block" : "mv-hidden md:mv-block"
                }  mv-w-full mv-text-neutral-700 mv-leading-5`}
              >
                <span className="mv-font-bold mv-text-lg mv-leading-6">
                  {organizations.length}
                </span>{" "}
                {locales.components.Map.organizationCountHeadline}
              </p>
              {mapMenuIsOpen === true ? (
                <Link
                  to="."
                  onClick={() => {
                    setMapMenuIsOpen(false);
                  }}
                >
                  <BurgerMenuOpen
                    aria-label={locales.components.Map.openMenu}
                  />
                </Link>
              ) : (
                <Link
                  to="?openMapMenu=true"
                  onClick={() => {
                    setMapMenuIsOpen(true);
                  }}
                >
                  <BurgerMenuClosed
                    aria-label={locales.components.Map.closeMenu}
                  />
                </Link>
              )}
            </div>
            {mapMenuIsOpen === true ? (
              <ul className="mv-w-full mv-flex mv-flex-col mv-gap-2">
                {organizations.map((organization) => {
                  return (
                    <ListItem
                      key={`organization-${organization.slug}`}
                      entity={organization}
                      locales={locales}
                      rel="noopener noreferrer"
                      target="_blank"
                    />
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Popup(props: { organization: MapOrganization; locales: MapLocales }) {
  const { organization, locales } = props;

  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-w-full mv-items-center mv-rounded-2xl mv-p-4 mv-bg-white mv-border mv-border-neutral-200">
      <div className="mv-relative mv-w-full mv-flex mv-flex-col mv-items-center mv-gap-2">
        <Avatar size="lg" {...organization} disableFadeIn={true} />
        <div className="mv-flex mv-flex-col mv-gap-1 mv-items-center">
          <h1 className="mv-appearance-none mv-text-base mv-text-center mv-mb-0 mv-text-primary mv-font-bold mv-leading-5">
            {organization.name}
          </h1>
          <p className="mv-text-neutral-700 mv-text-center mv-font-semibold">
            {[...organization.types, ...organization.networkTypes]
              .map((relation) => {
                let title;
                if (relation.slug in locales.organizationTypes) {
                  type LocaleKey = keyof typeof locales.organizationTypes;
                  title =
                    locales.organizationTypes[relation.slug as LocaleKey].title;
                } else if (relation.slug in locales.networkTypes) {
                  type LocaleKey = keyof typeof locales.networkTypes;
                  title =
                    locales.networkTypes[relation.slug as LocaleKey].title;
                } else {
                  console.error(
                    `Organization or network type ${relation.slug} not found in locales`
                  );
                  title = relation.slug;
                }
                return title;
              })
              .join(", ")}
          </p>
        </div>
        <address className="mv-not-italic mv-text-center mv-text-neutral-700">
          {organization.street !== null ? `${organization.street} ` : ""}
          {organization.streetNumber !== null
            ? `${organization.streetNumber}, `
            : ""}
          {organization.zipCode !== null ? `${organization.zipCode} ` : ""}
          {organization.city !== null ? `${organization.city}` : ""}
        </address>
        <div className="mv-absolute mv-right-0 mv-top-0">
          <CloseX width={16} height={16} />
        </div>
      </div>
      <a
        href={`/organization/${organization.slug}`}
        className="mv-appearance-none mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5 mv-w-full mv-bg-white mv-border mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-ring-1 focus:mv-ring-primary-200 focus:mv-outline-none focus:mv-border-primary-200"
        rel="noreferrer noopener"
        target="_blank"
      >
        {locales.components.Map.organizationCardCta}
      </a>
    </div>
  );
}
