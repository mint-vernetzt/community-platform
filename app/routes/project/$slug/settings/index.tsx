import { LoaderFunction, redirect } from "remix";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { params } = args;
  return redirect(`/project/${params.slug}/settings/general`);
};
