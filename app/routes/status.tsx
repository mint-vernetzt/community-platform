import { useLoaderData } from "react-router";

export const loader = async () => {
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
