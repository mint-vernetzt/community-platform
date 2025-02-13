import { redirect } from "react-router";

// handle "/profiles" as default route
export const loader = async () => {
  return redirect("/explore/profiles");
};
