import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import {
  Avatar,
  AvatarList,
} from "@mint-vernetzt/components/src/molecules/Avatar";
import { type Organization } from "@prisma/client";
import maplibreGL from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, useSearchParams, useSubmit } from "react-router";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { type ArrayElement } from "~/lib/utils/types";
import { type MapLocales } from "~/routes/map.server";
import { HeaderLogo } from "./HeaderLogo";
import { ListItem, type ListOrganization } from "./ListItem";
import { BurgerMenuClosed } from "./icons/BurgerMenuClosed";
import { BurgerMenuOpen } from "./icons/BurgerMenuOpen";
import { MapPopupClose } from "./icons/MapPopupClose";

type MapOrganization = ListOrganization &
  Pick<
    Organization,
    "longitude" | "latitude" | "street" | "streetNumber" | "zipCode" | "city"
  > & {
    networkMembers: {
      slug: string;
      name: string;
      logo?: string | null;
      blurredLogo?: string;
    }[];
  };

export function Map(props: {
  organizations: Array<MapOrganization>;
  locales: MapLocales;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  embeddable?: boolean;
}) {
  const { organizations, locales, language, embeddable = false } = props;
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const openMenuSearchParams = extendSearchParams(searchParams, {
    addOrReplace: {
      openMapMenu: "true",
    },
  });
  const closeMenuSearchParams = extendSearchParams(searchParams, {
    remove: ["openMapMenu"],
  });

  const [mapMenuIsOpen, setMapMenuIsOpen] = useState(
    searchParams.get("openMapMenu") === "true"
  );

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibreGL.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const lastOrgsRef = useRef<MapOrganization[]>([]);
  const lastLanguageRef = useRef<ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  > | null>(null);
  const activePopupsRef = useRef<maplibreGL.Popup[]>([]);
  const hoverPopupsRef = useRef<maplibreGL.Popup[]>([]);
  const [highlightedOrganization, setHighlightedOrganization] = useState<
    string | null
  >(null);
  const popupClosedByHandlerRef = useRef(false);
  const [hideAlert, setHideAlert] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current === null && mapContainer.current !== null) {
      const center = [10.451526, 51.165691] as [number, number];
      const zoom = 5.2;
      const minZoom = 2;
      const maxZoom = 18;
      // eslint-disable-next-line import/no-named-as-default-member
      mapRef.current = new maplibreGL.Map({
        container: mapContainer.current,
        style: `${ENV.COMMUNITY_BASE_URL}/map-style`,
        center,
        zoom,
        minZoom,
        maxZoom,
        transformRequest: (url) => {
          if (url.startsWith("https://tiles.versatiles.org/")) {
            return {
              url: `${
                ENV.COMMUNITY_BASE_URL
              }/map-proxy?path=${encodeURIComponent(
                url.replace("https://tiles.versatiles.org", "")
              )}`,
            };
          }
          return { url };
        },
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

      mapRef.current.on("load", async () => {
        setMapLoaded(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctrlContainerTopRight = document.querySelector(
      ".maplibregl-ctrl-top-right .maplibregl-ctrl"
    );
    if (ctrlContainerTopRight !== null && embeddable === false) {
      ctrlContainerTopRight.classList.add("maplibregl-ctrl-not-embeddable");
    }
    const infoCtrlBottomRight = document.querySelector(
      ".maplibregl-ctrl-bottom-right .maplibregl-compact-show"
    );
    if (infoCtrlBottomRight !== null) {
      infoCtrlBottomRight.classList.remove("maplibregl-compact-show");
    }
  }, [mapLoaded, embeddable]);

  const unclusteredClickHandler = useCallback(
    (
      event: maplibreGL.MapMouseEvent & {
        features?: maplibreGL.MapGeoJSONFeature[];
      } & {
        slug?: string;
      }
    ) => {
      if (mapRef.current === null) {
        return;
      }
      const slug =
        "slug" in event
          ? event.slug
          : typeof event.features !== "undefined"
          ? (event.features[0].properties.id as string)
          : null;
      if (slug === null) {
        return;
      }
      const organization = organizations.find((organization) => {
        return organization.slug === slug;
      });
      if (
        typeof organization === "undefined" ||
        organization.longitude === null ||
        organization.latitude === null
      ) {
        return;
      }
      const coordinates = [
        parseFloat(organization.longitude),
        parseFloat(organization.latitude),
      ];
      const offsetCoordinateToFocusPopup = coordinates[1] - 0.0002;

      mapRef.current.flyTo({
        center: [coordinates[0], offsetCoordinateToFocusPopup],
        zoom: 18,
        essential: true,
      });

      popupClosedByHandlerRef.current = true;
      for (const popup of activePopupsRef.current) {
        popup.remove();
      }
      for (const popup of hoverPopupsRef.current) {
        popup.remove();
      }
      popupClosedByHandlerRef.current = false;
      // eslint-disable-next-line import/no-named-as-default-member
      const popup = new maplibreGL.Popup()
        .setLngLat([
          parseFloat(organization.longitude),
          parseFloat(organization.latitude),
        ])
        .setHTML(
          renderToStaticMarkup(
            <Popup
              organization={organization}
              locales={locales}
              embeddable={embeddable}
            />
          )
        );
      popup.on("open", () => {
        setHighlightedOrganization(organization.slug);
        const mapMenu = document.getElementById("map-menu");
        const listItem = document.getElementById(
          `list-item-${organization.slug}`
        );
        if (mapMenu !== null && listItem !== null) {
          mapMenu.scrollTo({
            top: listItem.offsetTop - 58,
            behavior: "smooth",
          });
        }
      });
      popup.on("close", () => {
        setHighlightedOrganization(null);
        if (
          mapRef.current !== null &&
          popupClosedByHandlerRef.current === false &&
          mapRef.current.getZoom() > 6
        ) {
          mapRef.current.flyTo({
            center: coordinates as [number, number],
            zoom: 6,
            essential: true,
          });
        }
      });
      activePopupsRef.current.push(popup);

      const onMove = () => {
        if (mapRef.current !== null) {
          const center = mapRef.current.getCenter();

          if (
            Math.abs(center.lng - coordinates[0]) < 0.00001 &&
            Math.abs(center.lat - offsetCoordinateToFocusPopup) < 0.00001
          ) {
            popup.addTo(mapRef.current);
            mapRef.current.off("move", onMove);
          }
        }
      };
      mapRef.current.on("move", onMove);
      mapRef.current.once("moveend", () => {
        if (mapRef.current !== null) {
          mapRef.current.off("move", onMove);
        }
      });
    },
    [locales, organizations, popupClosedByHandlerRef, embeddable]
  );

  useEffect(() => {
    if (
      mapLoaded &&
      mapRef.current !== null &&
      JSON.stringify(lastOrgsRef.current) !== JSON.stringify(organizations)
    ) {
      lastOrgsRef.current = organizations;

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

      for (const popup of activePopupsRef.current) {
        popup.remove();
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

      const unclusteredMouseEnterHandler = (
        event: maplibreGL.MapMouseEvent & {
          features?: maplibreGL.MapGeoJSONFeature[];
        }
      ) => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "pointer";
          if (
            typeof event.features === "undefined" ||
            typeof event.features[0] === "undefined"
          ) {
            return;
          }
          const feature = event.features[0];
          const slug = feature.properties.id as string | null | undefined;
          if (typeof slug === "undefined" || slug === null) {
            return;
          }
          const organization = organizations.find((organization) => {
            return organization.slug === slug;
          });
          if (
            typeof organization === "undefined" ||
            organization.longitude === null ||
            organization.latitude === null
          ) {
            return;
          }

          for (const popup of hoverPopupsRef.current) {
            popup.remove();
          }
          // eslint-disable-next-line import/no-named-as-default-member
          const popup = new maplibreGL.Popup()
            .setLngLat([
              parseFloat(organization.longitude),
              parseFloat(organization.latitude),
            ])
            .setHTML(
              renderToStaticMarkup(
                <Popup
                  organization={organization}
                  locales={locales}
                  embeddable={embeddable}
                />
              )
            );
          popup.on("open", () => {
            setHighlightedOrganization(organization.slug);
            const mapMenu = document.getElementById("map-menu");
            const listItem = document.getElementById(
              `list-item-${organization.slug}`
            );
            if (mapMenu !== null && listItem !== null) {
              mapMenu.scrollTo({
                top: listItem.offsetTop - 58,
                behavior: "smooth",
              });
            }
          });
          popup.on("close", () => {
            setHighlightedOrganization(null);
          });
          hoverPopupsRef.current.push(popup);
          popup.addTo(mapRef.current);
        }
      };

      const unclusteredMouseLeaveHandler = () => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "";
          for (const popup of hoverPopupsRef.current) {
            popup.remove();
          }
        }
      };

      const clusterMouseEnterHandler = () => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "pointer";
        }
      };

      const clusterMouseLeaveHandler = () => {
        if (mapRef.current !== null) {
          mapRef.current.getCanvas().style.cursor = "";
        }
      };

      if (mapRef.current.getLayer("clusters")) {
        mapRef.current.removeLayer("clusters");
      }
      if (mapRef.current.getLayer("unclustered-point")) {
        mapRef.current.removeLayer("unclustered-point");
      }
      if (mapRef.current.getLayer("cluster-count")) {
        mapRef.current.removeLayer("cluster-count");
      }
      if (mapRef.current.getSource("organizations")) {
        mapRef.current.removeSource("organizations");
      }

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
          "text-font": ["noto_sans_bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#fff",
        },
      });

      mapRef.current.off("click", "clusters", clusterClickHandler);
      mapRef.current.on("click", "clusters", clusterClickHandler);

      mapRef.current.off("click", "unclustered-point", unclusteredClickHandler);
      mapRef.current.on("click", "unclustered-point", unclusteredClickHandler);

      mapRef.current.off("mouseenter", "clusters", clusterMouseEnterHandler);
      mapRef.current.on("mouseenter", "clusters", clusterMouseEnterHandler);
      mapRef.current.off("mouseleave", "clusters", clusterMouseLeaveHandler);
      mapRef.current.on("mouseleave", "clusters", clusterMouseLeaveHandler);

      mapRef.current.off(
        "mouseenter",
        "unclustered-point",
        unclusteredMouseEnterHandler
      );
      mapRef.current.on(
        "mouseenter",
        "unclustered-point",
        unclusteredMouseEnterHandler
      );
      mapRef.current.off(
        "mouseleave",
        "unclustered-point",
        unclusteredMouseLeaveHandler
      );
      mapRef.current.on(
        "mouseleave",
        "unclustered-point",
        unclusteredMouseLeaveHandler
      );
      // [["south", "west"], ["north", "east"]]
      let organizationBounds: [[number, number], [number, number]] | null =
        null;
      for (const organization of organizations) {
        const { longitude, latitude } = organization;
        if (longitude === null || latitude === null) {
          continue;
        }
        const lng = parseFloat(longitude);
        const lat = parseFloat(latitude);
        if (organizationBounds === null) {
          organizationBounds = [
            [lng, lat],
            [lng, lat],
          ];
          continue;
        }
        const westLng = Math.min(organizationBounds[0][0], lng);
        const southLat = Math.min(organizationBounds[0][1], lat);
        const eastLng = Math.max(organizationBounds[1][0], lng);
        const northLat = Math.max(organizationBounds[1][1], lat);
        organizationBounds = [
          [westLng, southLat],
          [eastLng, northLat],
        ];
      }
      if (organizationBounds !== null) {
        const camera = mapRef.current.cameraForBounds(organizationBounds);
        mapRef.current.fitBounds(organizationBounds, {
          padding: 24,
        });
        const sw = organizationBounds[0];
        const ne = organizationBounds[1];
        const center: [number, number] = [
          (sw[0] + ne[0]) / 2,
          (sw[1] + ne[1]) / 2,
        ];
        mapRef.current.setCenter(center);
        if (
          typeof camera !== "undefined" &&
          typeof camera.zoom !== "undefined"
        ) {
          mapRef.current.setZoom(camera.zoom - 1);
        }
      }
    }
  }, [mapLoaded, organizations, locales, unclusteredClickHandler, embeddable]);

  useEffect(() => {
    if (
      mapLoaded &&
      mapRef.current !== null &&
      lastLanguageRef.current !== language
    ) {
      lastLanguageRef.current = language;
      const labels = [
        "label-address-housenumber",
        "label-motorway-shield",
        "label-street-pedestrian",
        "label-street-livingstreet",
        "label-street-residential",
        "label-street-unclassified",
        "label-street-tertiary",
        "label-street-secondary",
        "label-street-primary",
        "label-street-trunk",
        "label-place-neighbourhood",
        "label-place-quarter",
        "label-place-suburb",
        "label-place-hamlet",
        "label-place-village",
        "label-place-town",
        "label-boundary-state",
        "label-place-city",
        "label-place-statecapital",
        "label-place-capital",
        "label-boundary-country-small",
        "label-boundary-country-medium",
        "label-boundary-country-large",
      ];

      for (const label of labels) {
        mapRef.current.setLayoutProperty(label, "text-field", [
          "get",
          `name_${language}`,
        ]);
      }
    }
  }, [mapLoaded, language]);

  return (
    <>
      <div
        ref={mapContainer}
        className={`mv-absolute mv-h-full mv-min-h-[284px] mv-overflow-hidden ${
          mapLoaded === true
            ? mapMenuIsOpen === true && organizations.length > 0
              ? "mv-left-0 mv-w-full md:mv-left-[336px] md:mv-w-[calc(100%-336px)]"
              : "mv-w-full"
            : "mv-w-0"
        }`}
      />
      {organizations.length > 0 ? (
        <div
          className={`mv-absolute mv-top-0 mv-bottom-0 mv-left-0 mv-w-fit md:mv-w-[336px] mv-pointer-events-none mv-z-10 ${
            mapMenuIsOpen === true
              ? "mv-w-full md:mv-w-[336px]"
              : "mv-w-fit md:mv-w-[336px]"
          }`}
        >
          <div
            className={`mv-flex mv-flex-col mv-gap-2 mv-p-2 mv-bg-white mv-border-neutral-200 mv-w-full mv-pointer-events-auto ${
              mapMenuIsOpen
                ? "mv-h-full mv-rounded-none mv-border-none md:mv-border-r"
                : "mv-rounded-br-2xl mv-border-r mv-border-b"
            }`}
          >
            <Link
              to={
                mapMenuIsOpen
                  ? `?${closeMenuSearchParams.toString()}`
                  : `?${openMenuSearchParams.toString()}`
              }
              onClick={() => {
                setMapMenuIsOpen(!mapMenuIsOpen);
              }}
              className="mv-p-2 hover:mv-bg-neutral-100 active:mv-bg-neutral-200 mv-rounded"
              preventScrollReset
              replace
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
              <ul
                id="map-menu"
                className="mv-w-full mv-h-full mv-flex mv-flex-col mv-gap-2 mv-px-4 mv-overflow-y-auto mv-py-2"
              >
                {organizations.map((organization) => {
                  return (
                    <ListItem
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (isMobile === true) {
                          setMapMenuIsOpen(false);
                          submit(closeMenuSearchParams, {
                            preventScrollReset: true,
                            replace: true,
                          });
                        }
                        if (mapRef.current === null) {
                          return;
                        }
                        // eslint-disable-next-line import/no-named-as-default-member
                        const mapEvent = new maplibreGL.MapMouseEvent(
                          "click",
                          mapRef.current,
                          event.nativeEvent
                        );
                        unclusteredClickHandler({
                          ...mapEvent,
                          preventDefault: () => event.preventDefault(),
                          defaultPrevented: false,
                          slug: event.currentTarget.id,
                        });
                      }}
                      id={organization.slug}
                      key={`organization-${organization.slug}`}
                      entity={organization}
                      locales={locales}
                      rel="noopener noreferrer"
                      target="_blank"
                      highlighted={
                        highlightedOrganization === organization.slug
                      }
                      preventScrollReset
                    />
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      {embeddable === true ? (
        <div className="mv-absolute mv-top-4 mv-right-4">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={locales.components.Map.toThePlatform}
          >
            <HeaderLogo
              locales={props.locales}
              width={32}
              height={32}
              aria-hidden="true"
              showLabel={false}
            />
          </Link>
        </div>
      ) : null}
      {embeddable === false && hideAlert === false ? (
        <div
          className={`mv-absolute ${
            mapMenuIsOpen === true && organizations.length > 0
              ? "mv-hidden md:mv-block mv-left-[344px]"
              : "mv-left-2"
          } mv-bottom-2 mv-right-2 mv-z-10 mv-h-fit`}
        >
          <Alert
            position="relative"
            textAlign={
              mapMenuIsOpen && organizations.length > 0 ? "left" : "center"
            }
            truncate={false}
            level="neutral"
            onClose={() => {
              setHideAlert(true);
            }}
          >
            {insertComponentsIntoLocale(locales.components.Map.whatIsShown, [
              <Link
                key="help-link"
                to="/help#organizationMapView"
                target="_blank"
                className="mv-font-bold hover:mv-underline"
              >
                {" "}
              </Link>,
            ])}
          </Alert>
        </div>
      ) : null}
    </>
  );
}

function Popup(props: {
  organization: MapOrganization;
  locales: MapLocales;
  embeddable: boolean;
}) {
  const { organization, locales, embeddable } = props;

  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-w-full mv-items-center mv-rounded-lg mv-p-4 mv-bg-white mv-border mv-border-neutral-200 mv-pointer-events-none">
      <div className="mv-relative mv-w-full mv-flex mv-flex-col mv-items-center mv-gap-2">
        <div className="mv-pointer-events-auto">
          <Avatar size="lg" {...organization} disableFadeIn={true} />
        </div>
        <div className="mv-flex mv-flex-col mv-gap-1 mv-items-center">
          <h1 className="mv-appearance-none mv-text-base mv-text-center mv-mb-0 mv-text-primary mv-font-bold mv-leading-5 mv-pointer-events-auto">
            {organization.name}
          </h1>
          <p className="mv-text-neutral-700 mv-text-center mv-font-semibold mv-pointer-events-auto">
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
        <address className="mv-not-italic mv-text-center mv-text-neutral-700 mv-pointer-events-auto">
          {organization.street !== null ? `${organization.street} ` : ""}
          {organization.streetNumber !== null
            ? `${organization.streetNumber}, `
            : ""}
          {organization.zipCode !== null ? `${organization.zipCode} ` : ""}
          {organization.city !== null ? `${organization.city}` : ""}
        </address>
        <div className="mv-absolute mv-right-0 mv-top-0 mv-pointer-events-auto">
          <MapPopupClose />
        </div>
      </div>
      {organization.networkMembers.length > 0 ? (
        <div className="mv-pointer-events-auto">
          <AvatarList
            visibleAvatars={2}
            moreIndicatorProps={{
              to: `/organization/${organization.slug}/detail/network`,
              as: "a",
            }}
          >
            {organization.networkMembers.map((networkMember) => {
              return (
                <Avatar
                  key={networkMember.slug}
                  {...networkMember}
                  as="a"
                  size="sm"
                  to={`/organization/${networkMember.slug}/detail/about`}
                  disableFadeIn={true}
                />
              );
            })}
          </AvatarList>
        </div>
      ) : null}
      <a
        href={`/organization/${organization.slug}/detail/about`}
        className="mv-appearance-none mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5 mv-w-full mv-bg-white mv-border mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-ring-1 focus:mv-ring-primary-200 focus:mv-outline-none focus:mv-border-primary-200 mv-pointer-events-auto"
        rel={embeddable === true ? "noreferrer noopener" : undefined}
        target={embeddable === true ? "_blank" : undefined}
      >
        {locales.components.Map.organizationCardCta}
      </a>
    </div>
  );
}
