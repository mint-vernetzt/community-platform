import mapStyleJSON from "~/styles/map/map-style.json";

export const loader = async () => {
  return new Response(JSON.stringify(mapStyleJSON), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
