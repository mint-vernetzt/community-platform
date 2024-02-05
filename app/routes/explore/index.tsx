import { redirect } from "@remix-run/node";

// handle "/profiles" as default route
export const loader = async () => {
  return redirect("/explore/profiles");
};
