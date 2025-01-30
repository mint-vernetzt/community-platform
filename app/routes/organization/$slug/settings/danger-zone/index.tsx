import { redirect } from "@remix-run/node";
import { Deep } from "~/lib/utils/searchParams";

// Handle change-url as default route
export const loader = async () => {
  return redirect(`./change-url?${Deep}=true`);
};
