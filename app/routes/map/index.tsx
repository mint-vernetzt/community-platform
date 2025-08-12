import { type HeadersArgs } from "react-router";

export function headers(args: HeadersArgs) {
  const { parentHeaders } = args;

  parentHeaders.delete("X-Frame-Options");

  const cspHeaders = parentHeaders.get("Content-Security-Policy");
  console.log("CSP Headers:", cspHeaders);

  return { headers: parentHeaders };
}

function MapIndex() {
  return (
    <div>
      <h1>Map Index</h1>
    </div>
  );
}

export default MapIndex;
