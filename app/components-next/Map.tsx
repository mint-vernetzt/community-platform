import { useEffect, useRef } from "react";
import maplibreGL from "maplibre-gl";
import { ListItem, type ListOrganization } from "./ListItem";
import { type MapLocales } from "~/routes/map.server";
import { type Organization } from "@prisma/client";

export function Map(props: {
  organizations: Array<
    ListOrganization & Pick<Organization, "longitude" | "latitude">
  >;
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
        new maplibreGL.Marker()
          .setLngLat([
            parseFloat(organization.longitude),
            parseFloat(organization.latitude),
          ])
          .addTo(mapRef.current);
      }
    }
  }, [mapContainer, organizations]);

  return (
    <>
      <div ref={mapContainer} className="mv-absolute mv-w-full mv-h-full" />
      {organizations.length > 0 ? (
        <div className="mv-absolute mv-top-6 mv-bottom-6 mv-left-6  mv-rounded-lg mv-w-[396px] mv-overflow-y-auto">
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
