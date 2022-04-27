import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { badRequest, serverError } from "remix-utils";
import { updatePassword } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

type LoaderData = {
  accessToken: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const url = new URL(request.url);

  const accessToken = url.searchParams.get("access_token");
  if (typeof accessToken !== "string" || accessToken === "") {
    throw badRequest({ message: "Access token required." });
  }

  return json<LoaderData>({ accessToken });
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    throw badRequest({ message: "Invalid Form Data." });
  }

  const accessToken = formData.get("accessToken");
  if (accessToken === null || accessToken === "") {
    throw badRequest({ message: "Access token required." });
  }

  const password = formData.get("password");
  const passwordControl = formData.get("passwordControl");

  if (
    password !== null &&
    password !== "" &&
    passwordControl !== null &&
    passwordControl !== ""
  ) {
    if (password !== passwordControl) {
      throw badRequest({ message: "Passwords not identical." });
    }
    const { error } = await updatePassword(
      accessToken as string,
      password as string
    );

    // ignore user with email not exist
    if (error) {
      console.error(error.message);
      throw serverError({ message: error.message });
    }
  }
  return redirect("/login");
};

export default function SetPassword() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <Form method="post">
      <input name="accessToken" type="hidden" value={loaderData?.accessToken} />
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="md:container md:mx-auto relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-6/12 px-4">
            <h1 className="mb-8">Neues Passwort vergeben</h1>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
            <div className="mb-4">
              <InputPassword id="password" label="Passwort" isRequired />
            </div>

            <div className="mb-8">
              <InputPassword
                id="passwordControl"
                label="Passwort wiederholen"
                isRequired
              />
            </div>

            <div className="mb-8">
              <button type="submit" className="btn btn-primary">
                Passwort speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
