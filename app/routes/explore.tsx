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
    <div className="relative pb-4 sm:pb-8 md:pb-16 lg:pb-20">
      <div className="">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Explore;
