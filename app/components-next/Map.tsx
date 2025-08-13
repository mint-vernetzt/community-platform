import { type Organization } from "@prisma/client";
import maplibreGL from "maplibre-gl";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { type MapLocales } from "~/routes/map.server";
import { ListItem, type ListOrganization } from "./ListItem";

type MapOrganization = ListOrganization &
  Pick<Organization, "longitude" | "latitude">;

export function Map(props: {
  organizations: Array<MapOrganization>;
  locales: MapLocales;
}) {
  const { organizations, locales } = props;

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
        }).setHTML(renderToStaticMarkup(<Popup organization={organization} />));
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
  }, [mapContainer, organizations]);

  return (
    <>
      <div ref={mapContainer} className="mv-absolute mv-w-full mv-h-full" />
      {organizations.length > 0 ? (
        <div className="mv-absolute mv-top-6 mv-bottom-6 mv-left-6 mv-rounded-lg mv-w-[396px] mv-overflow-y-auto">
          <ul className="mv-flex mv-flex-col mv-gap-2.5 mv-py-6 mv-px-4 mv-bg-white mv-rounded-lg mv-w-full">
            {organizations.map((organization) => {
              return (
                <ListItem
                  key={`organization-${organization.slug}`}
                  entity={organization}
                  locales={locales}
                />
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function Popup(props: { organization: MapOrganization }) {
  const { organization } = props;

  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-w-full mv-items-center mv-rounded-2xl mv-p-4">
      <h1 className="mv-appearance-none mv-text-base mv-text-center mv-mb-0 mv-text-primary mv-font-bold mv-leading-5">
        {organization.name}
      </h1>
      <a
        href={`/organization/${organization.slug}`}
        className="mv-appearance-none mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5 mv-w-full mv-bg-white mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-ring-1 focus:mv-ring-primary-200 focus:mv-outline-none focus:mv-border-primary-200"
        rel="noreferrer noopener"
        target="_blank"
      >
        Organisation ansehen
      </a>
    </div>
  );
}
