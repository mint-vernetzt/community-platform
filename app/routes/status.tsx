import { useLoaderData } from "react-router";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async () => {
  invariantResponse(false, "This is a test error", { status: 500 });
  return { message: "Server is up and running" };
};

export const action = async () => {
  return { message: "Server is up and running" };
};

export default function Status() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Status</h1>
      <p>{loaderData.message}</p>
    </>
  );
}
