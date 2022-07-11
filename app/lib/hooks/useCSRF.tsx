import { useRouteData } from "remix-utils";
import { RootRouteData } from "~/root";

export default function useCSRF() {
  const rootRouteData = useRouteData<RootRouteData>("/");
  return rootRouteData !== undefined && rootRouteData.csrf !== undefined ? (
    <input name="csrf" value={rootRouteData.csrf} hidden />
  ) : null;
}
