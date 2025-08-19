import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { type Organization } from "@prisma/client";
import maplibreGL from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, useSearchParams } from "react-router";
import { type MapLocales } from "~/routes/map.server";
import { ListItem, type ListOrganization } from "./ListItem";
import { BurgerMenuClosed } from "./icons/BurgerMenuClosed";
import { BurgerMenuOpen } from "./icons/BurgerMenuOpen";
import { MapPopupClose } from "./icons/MapPopupClose";

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
      const zoom = 5.2;
      const minZoom = 2;
      const maxZoom = 18;
      // eslint-disable-next-line import/no-named-as-default-member
      mapRef.current = new maplibreGL.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
        minZoom,
        maxZoom,
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

      const geoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };

      for (const organization of organizations) {
        if (organization.longitude === null || organization.latitude === null) {
          continue;
        }

        const feature: GeoJSON.Feature<
          GeoJSON.Point,
          GeoJSON.GeoJsonProperties
        > = {
          type: "Feature",
          properties: {
            id: organization.slug,
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(organization.longitude),
              parseFloat(organization.latitude),
            ],
          },
        };

        geoJSON.features.push(feature);
      }

      const clusterClickHandler = async (
        event: maplibreGL.MapMouseEvent & {
          features?: maplibreGL.MapGeoJSONFeature[];
        }
      ) => {
        if (mapRef.current !== null) {
          const features = mapRef.current.queryRenderedFeatures(event.point, {
            layers: ["clusters"],
          });
          const clusterId = features[0].properties.cluster_id;
          const source = mapRef.current.getSource("organizations");
          if (typeof source !== "undefined") {
            const geoJsonSource = source as maplibreGL.GeoJSONSource;
            const zoom = await geoJsonSource.getClusterExpansionZoom(clusterId);
            const currentZoom = mapRef.current.getZoom();
            const duration = ((zoom - currentZoom) * 4000) / zoom;
            mapRef.current.flyTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [
                number,
                number
              ],
              zoom,
              duration,
            });
          }
        }
      };

      // eslint-disable-next-line import/no-named-as-default-member
      const popup = {
        instance: new maplibreGL.Popup({
          offset: 40,
          className: "mv-mt-4",
          closeOnClick: false,
        }),
        slug: "",
      };

      const unclusteredClickHandler = (
        event: maplibreGL.MapMouseEvent & {
          features?: maplibreGL.MapGeoJSONFeature[];
        }
      ) => {
        if (
          typeof event.features === "undefined" ||
          typeof event.features[0] === "undefined" ||
          mapRef.current === null
        ) {
          return;
        }
        const feature = event.features[0];
        const coordinates = (
          (feature.geometry as GeoJSON.Point).coordinates as [number, number]
        ).slice();
        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        // x/2000 = (currentZoom - 16)/16
        const currentZoom = mapRef.current.getZoom();
        const zoom = 16;
        const duration = ((zoom - currentZoom) * 4000) / zoom;

        mapRef.current.flyTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number
          ],
          zoom,
          duration,
        });

        const slug = feature.properties.id as string;

        const organization = organizations.find((organization) => {
          return organization.slug === slug;
        });

        if (
          typeof organization !== "undefined" &&
          organization.longitude !== null &&
          organization.latitude !== null
        ) {
          // eslint-disable-next-line import/no-named-as-default-member
          popup.instance
            .setLngLat([
              parseFloat(organization.longitude),
              parseFloat(organization.latitude),
            ])
            .setHTML(
              renderToStaticMarkup(
                <Popup organization={organization} locales={locales} />
              )
            )
            .addTo(mapRef.current);
          popup.slug = slug;
        }
      };

      const mouseEnterHandler = () => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "pointer";
        }
      };

      const mouseLeaveHandler = () => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "";
        }
      };

      mapRef.current.on("load", async () => {
        if (mapRef.current !== null) {
          mapRef.current.addSource("organizations", {
            type: "geojson",
            data: geoJSON,
            cluster: true,
            clusterMaxZoom: 16,
            clusterRadius: 50,
          });

          mapRef.current.addLayer({
            id: "clusters",
            type: "circle",
            source: "organizations",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#2D6BE1",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                24,
                5,
                32,
                20,
                40,
                100,
                48,
                300,
                56,
              ],
              "circle-stroke-width": [
                "step",
                ["get", "point_count"],
                2,
                100,
                3,
                300,
                4,
              ],
              "circle-stroke-color": "#2D6BE166",
            },
          });

          mapRef.current.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "organizations",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": "#2D6BE1",
              "circle-radius": 16,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#2D6BE166",
            },
          });

          mapRef.current.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "organizations",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Noto Sans Bold"],
              "text-size": 14,
            },
            paint: {
              "text-color": "#fff",
            },
          });

          mapRef.current.on("click", "clusters", clusterClickHandler);

          mapRef.current.on(
            "click",
            "unclustered-point",
            unclusteredClickHandler
          );

          mapRef.current.on("mouseenter", "clusters", mouseEnterHandler);
          mapRef.current.on("mouseleave", "clusters", mouseLeaveHandler);

          mapRef.current.on("mouseenter", "unclustered-point", (event) => {
            if (
              typeof event.features === "undefined" ||
              typeof event.features[0] === "undefined" ||
              mapRef.current === null
            ) {
              return;
            }
            mapRef.current.getCanvas().style.cursor = "pointer";

            const feature = event.features[0];
            const slug = feature.properties.id as string;

            const organization = organizations.find((organization) => {
              return organization.slug === slug;
            });

            if (
              typeof organization !== "undefined" &&
              organization.longitude !== null &&
              organization.latitude !== null &&
              popup.slug !== slug
            ) {
              // eslint-disable-next-line import/no-named-as-default-member
              const popup = new maplibreGL.Popup({
                offset: 40,
                closeOnClick: false,
                className: "mv-mt-4",
              })
                .setLngLat([
                  parseFloat(organization.longitude),
                  parseFloat(organization.latitude),
                ])
                .setHTML(
                  renderToStaticMarkup(
                    <Popup organization={organization} locales={locales} />
                  )
                )
                .addTo(mapRef.current);

              const mouseleaveHandler = () => {
                if (mapRef.current !== null) {
                  console.log("fire");
                  mapRef.current.getCanvas().style.cursor = "";
                  popup.remove();
                  mapRef.current.off(
                    "mouseleave",
                    "unclustered-point",
                    mouseleaveHandler
                  );
                }
              };

              mapRef.current.on(
                "mouseleave",
                "unclustered-point",
                mouseleaveHandler
              );
            }
          });
        }
      });
    }
  }, [mapContainer, organizations, locales]);

  return (
    <>
      <div
        ref={mapContainer}
        className={`mv-absolute mv-h-full mv-overflow-hidden ${
          mapMenuIsOpen ? "mv-right-0 mv-w-[calc(100vw-336px)]" : "mv-w-full"
        }`}
      />
      {organizations.length > 0 ? (
        <div
          className={`mv-absolute mv-top-0 mv-bottom-0 mv-left-0 mv-w-fit md:mv-w-[336px] mv-overflow-y-auto mv-pointer-events-none mv-z-10 ${
            mapMenuIsOpen
              ? "mv-w-screen md:mv-w-[336px]"
              : "mv-w-fit md:mv-w-[336px]"
          }`}
        >
          <div
            className={`mv-flex mv-flex-col mv-gap-2 mv-p-2 mv-bg-white mv-border-r mv-border-neutral-200 mv-w-full mv-pointer-events-auto ${
              mapMenuIsOpen
                ? "mv-min-h-full mv-rounded-l-2xl"
                : "mv-rounded-br-2xl"
            }`}
          >
            <Link
              to={mapMenuIsOpen ? "." : "?openMapMenu=true"}
              onClick={() => {
                setMapMenuIsOpen(!mapMenuIsOpen);
              }}
              className="mv-p-2 hover:mv-bg-neutral-100 active:mv-bg-neutral-200 mv-rounded"
            >
              <div className="mv-flex mv-items-center mv-gap-2.5">
                <p
                  className={`${
                    mapMenuIsOpen ? "mv-block" : "mv-hidden md:mv-block"
                  }  mv-w-full mv-text-neutral-700 mv-leading-5`}
                >
                  <span className="mv-font-bold mv-text-lg mv-leading-6">
                    {organizations.length}
                  </span>{" "}
                  {locales.components.Map.organizationCountHeadline}
                </p>
                {mapMenuIsOpen ? (
                  <BurgerMenuOpen
                    className="mv-shrink-0"
                    aria-label={locales.components.Map.openMenu}
                  />
                ) : (
                  <BurgerMenuClosed
                    className="mv-shrink-0"
                    aria-label={locales.components.Map.closeMenu}
                  />
                )}
              </div>
            </Link>
            {mapMenuIsOpen ? (
              <ul className="mv-w-full mv-flex mv-flex-col mv-gap-2 mv-px-4">
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
          <MapPopupClose />
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
