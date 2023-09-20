import type { DataFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  createAuthClient(request, response);

  return response;
};

function Explore() {
  return <Outlet />;
}

export default Explore;
