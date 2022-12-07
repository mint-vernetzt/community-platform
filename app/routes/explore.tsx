import type { LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createAuthClient(request, response);

  return response;
};

function Explore() {
  return (
    <div className="relative pb-44">
      <div className="">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Explore;
