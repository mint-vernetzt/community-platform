import { type LinksFunction, type LoaderFunctionArgs } from "react-router";
import { checkFeatureAbilitiesOrThrow } from "../feature-access.server";
import { createAuthClient } from "~/auth.server";
import { useEffect, useRef } from "react";
import maplibreGL from "maplibre-gl";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, "map");

  return null;
}

function MapIndex() {
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
    }
  }, [mapContainer]);

  return (
    <div className="mv-relative mv-w-screen mv-h-dvh">
      <div ref={mapContainer} className="mv-absolute mv-w-full mv-h-full" />
    </div>
  );
}

export default MapIndex;
