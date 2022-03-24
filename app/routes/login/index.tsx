import { ActionFunction, json, LoaderFunction } from "remix";

export const loader: LoaderFunction = async (args) => {
  return null;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return json("Bad Request", { status: 400 });
  }
  
  const email = formData.get("email");
  const password = formData.get("password");

  // TODO: Maybe check types
  // can't test it because FormData only accepts strings or blobs
  if (email === null || password === null || email === "" || password === "") {
    return json("Bad Request", { status: 400 });
  }

  return null;
};;

export default function Index() {
  return <>Index</>;
}
