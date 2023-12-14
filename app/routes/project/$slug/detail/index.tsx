import { type LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async (args: LoaderFunctionArgs) => {
  const response = new Response();

  return redirect("./about", { headers: response.headers });
};
