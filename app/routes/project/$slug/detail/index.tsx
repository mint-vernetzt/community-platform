import { redirect, type DataFunctionArgs } from "@remix-run/node";

export const loader = async (args: DataFunctionArgs) => {
  const response = new Response();

  return redirect("./about", { headers: response.headers });
};
