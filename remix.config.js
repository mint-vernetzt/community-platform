import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  /* Any Node.js polyfills to include in the browser build.
  -> see: https://remix.run/docs/en/main/file-conventions/remix-config#browsernodebuiltinspolyfill */
  browserNodeBuiltinsPolyfill: { modules: { crypto: true } },
  cacheDirectory: ".cache",
  // future: {
  //   // makes the warning go away in v1.15
  //   v2_routeConvention: true,
  // },
  ignoredRouteFiles: ["**/*"],
  publicPath: "/build/",
  postcss: true,
  routes(defineRoutes) {
    // uses the v1 convention, works in v1.15+ and v2
    return createRoutesFromFolders(defineRoutes);
  },
  /* A server entrypoint, relative to the root directory that becomes your server's main module.
  If specified, Remix will compile this file along with your application into a single file to be deployed to your server.
  This file can use either a .js or .ts file extension. */
  // server: "",
  serverBuildPath: "build/index.js",
  /* The order of conditions to use when resolving server dependencies' exports field in package.json. */
  // serverConditions: [],
  // serverDependenciesToBundle: ["all"],
  serverMainFields: ["module", "main"],
  serverMinify: false,
  serverModuleFormat: "esm",
  /* Any Node.js polyfills to include in the server build when targeting non-Node.js server platforms.
  -> see: https://remix.run/docs/en/main/file-conventions/remix-config#servernodebuiltinspolyfill */
  // serverNodeBuiltinsPolyfill: {},
  serverPlatform: "node",
  tailwind: true,
  watchPaths: ["./common/components"],
};
