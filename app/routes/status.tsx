import { json, type ActionFunctionArgs, redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/");
};

export const action = async (args: ActionFunctionArgs) => {
  // TODO: Remove this
  // Abuse report tool testing
  const { request } = args;
  console.log("ENDPOINT REQUEST", {
    json: await request.json(),
    referrer: request.referrer,
  });

  return json({ message: "The Server is up and running" });
};
