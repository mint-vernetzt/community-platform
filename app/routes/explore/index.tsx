import { LoaderFunction, redirect } from "remix";

// handle "/profiles" as default route
export const loader: LoaderFunction = async () => {
  return redirect("/explore/profiles");
};
