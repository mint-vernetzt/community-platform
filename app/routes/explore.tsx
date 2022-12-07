import type { LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

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
