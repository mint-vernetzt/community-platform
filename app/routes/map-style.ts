import { safeStringify } from "~/lib/utils/json";
import mapStyleJSON from "~/styles/map/map-style.json";

export const loader = async () => {
  return new Response(safeStringify(mapStyleJSON), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
