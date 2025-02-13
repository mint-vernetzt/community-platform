import { type LoaderFunctionArgs, redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const error = searchParams.get("error");
  if (typeof error === "string") {
    console.error(`An error was reported from client:\n\n${error}\n`);
  }
  return redirect("/");
};
