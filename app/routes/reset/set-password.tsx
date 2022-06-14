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
import { Form as RemixForm, formAction, performMutation } from "remix-forms";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";

const schema = z.object({
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
  confirmPassword: z
    .string()
    .min(1, "Passwort wiederholen um Rechtschreibfehler zu vermeiden."),
  accessToken: z.string().min(1),
});

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

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action: ActionFunction = async ({ request }) =>
  formAction({
    request,
    schema,
    mutation,
    successPath: "/login",
  });

// let formData: FormData;
// try {
//   formData = await request.formData();
// } catch (error) {
//   throw badRequest({ message: "Invalid Form Data." });
// }

// const accessToken = formData.get("accessToken");
// if (accessToken === null || accessToken === "") {
//   throw badRequest({ message: "Access token required." });
// }

// const password = formData.get("password");
// const passwordControl = formData.get("passwordControl");

// if (
//   password !== null &&
//   password !== "" &&
//   passwordControl !== null &&
//   passwordControl !== ""
// ) {
//   if (password !== passwordControl) {
//     throw badRequest({ message: "Passwords not identical." });
//   }
//   const { error } = await updatePassword(
//     accessToken as string,
//     password as string
//   );

//   // ignore user with email not exist
//   if (error) {
//     console.error(error.message);
//     throw serverError({ message: error.message });
//   }
// }
// return redirect("/login");

export default function SetPassword() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <RemixForm method="post" schema={schema}>
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <div className="mb-4">
                  <Field name="password" label="Neues Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label="Neues Passwort"
                          required
                          {...register("password")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <div className="mb-8">
                  <Field name="confirmPassword" label="Wiederholen">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="confirmPassword"
                          label="Passwort wiederholen"
                          required
                          {...register("confirmPassword")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <Field name="accessToken">
                  {({ Errors }) => (
                    <>
                      <input
                        type="hidden"
                        value={loaderData?.accessToken}
                        {...register("accessToken")}
                      ></input>
                      <Errors />
                    </>
                  )}
                </Field>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    Passwort speichern
                  </button>
                </div>
              </div>
            </div>
          )}
        </RemixForm>
        {/* <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
          </div>
        </div> */}
      </div>
    </>
  );
}
