import { json, type ActionFunctionArgs } from "@remix-run/node";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  console.log("ENDPOINT REQUEST", {
    json: await request.json(),
    referrer: request.referrer,
  });

  return json({ message: "Success" }, { status: 200 });
};
