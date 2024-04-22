import { json, redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/");
};

export const action = async () => {
  return json({ message: "The Server is up and running" });
};
