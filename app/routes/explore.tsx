import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { response } = createAuthClient(request);

  return response;
};

function Explore() {
  return <Outlet />;
}

export default Explore;
