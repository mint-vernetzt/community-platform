// import { useRouteData } from "remix-utils";

// TODO: To use this hook add csrf to RootRouteData on root.tsx
// export default function useCSRF() {
//   const rootRouteData = useRouteData<RootRouteData>("/");

//   const hiddenCSRFInput =
//     rootRouteData !== undefined && rootRouteData.csrf !== undefined ? (
//       <input name="csrf" value={rootRouteData.csrf} hidden />
//     ) : null;
//   const csrfToken =
//     rootRouteData !== undefined && rootRouteData.csrf !== undefined
//       ? rootRouteData.csrf
//       : null;
//   return { hiddenCSRFInput, csrfToken };
// }
