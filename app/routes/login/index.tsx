import { ActionFunction, LoaderFunction } from "remix";
import { badRequest, validateFormData } from "../../utils";
import { authenticator } from "../../auth.server";

export const Routes = {
  SuccessRedirect: "/",
  FailureRedirect: "/login",
};

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

  const isFormDataValid = validateFormData(["email", "password"], formData);
  if (!isFormDataValid) {
    return badRequest();
  }

  return authenticator.authenticate("sb", request, {
    successRedirect: Routes.SuccessRedirect,
    failureRedirect: Routes.FailureRedirect,
  });
};

export default function Index() {
  return <>Index</>;
}
