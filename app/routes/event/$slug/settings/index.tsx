import { LoaderFunction, redirect } from "@remix-run/node";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { params } = args;
  return redirect(`/event/${params.slug}/settings/general`);
};
