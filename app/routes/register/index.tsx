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
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const academicTitle = formData.get("academicTitle");

  if (
    email === null ||
    password === null ||
    firstName === null ||
    lastName === null ||
    email === "" ||
    password === "" ||
    firstName === "" ||
    lastName === ""
  ) {
    return json("Bad Request", { status: 400 });
  }

  return json({});
};

export default function Index() {
  return <>Index</>;
}
