import { useEffect, useRef } from "react";
import maplibreGL from "maplibre-gl";

export function Map() {
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

  return <div ref={mapContainer} className="mv-absolute mv-w-full mv-h-full" />;
}
