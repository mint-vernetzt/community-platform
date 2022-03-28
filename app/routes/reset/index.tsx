import { ActionFunction, json, LoaderFunction } from "remix";
import { badRequest, validateFormData } from "../../utils";

export const loader: LoaderFunction = async (args) => {
  return null;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return badRequest();
  }

  const isFormDataValid = validateFormData(["email"], formData);

  if (!isFormDataValid) {
    return badRequest();
  }

  return json({});
};

export default function Index() {
  return <>Index</>;
}
