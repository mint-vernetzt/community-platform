import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

// handle "/profiles" as default route
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/explore/profiles");
};
