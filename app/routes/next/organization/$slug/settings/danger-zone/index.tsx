import { redirect } from "@remix-run/node";
import { DeepSearchParam } from "~/searchParams";

// Handle change-url as default route
export const loader = async () => {
  return redirect(`./change-url?${DeepSearchParam}=true`);
};
