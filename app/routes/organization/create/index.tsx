import { ActionFunction, Link, LoaderFunction } from "remix";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, formAction } from "remix-forms";
import Input from "~/components/FormElements/Input/Input";

const schema = z.object({
  organizationName: z
    .string()
    .min(1, "Bitte einen Namen der Organisation angeben."),
});

export const loader: LoaderFunction = async () => {
  return null;
};

const mutation = makeDomainFunction(schema)(async (values) => {
  if (values.organizationName === "error") {
    throw "error";
  }
  return values;
});

export const action: ActionFunction = async ({ request }) => {
  const formActionResult = formAction({
    request,
    schema,
    mutation,
    successPath: "/explore",
  });
  return formActionResult;
};

export default function Index() {
  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container relative z-10">
          <div className="py-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="container relative pb-44">
        <h4 className="font-semibold">
          Organisation, Netzwerk, Projekt hinzufügen
        </h4>
        <div className="flex flex-col lg:flex-row pt-10 lg:pt-0">
          <RemixForm method="post" schema={schema}>
            {({ Field, Button, Errors, register }) => (
              <>
                <Field name="organizationName" className="mb-4">
                  {({ Errors }) => (
                    <>
                      <Input
                        id="organizationName"
                        label="Name der Organisation"
                        {...register("organizationName")}
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <button
                  type="submit"
                  className="btn btn-outline-primary ml-auto btn-small"
                >
                  Organisation anlegen
                </button>
                <Errors />
              </>
            )}
          </RemixForm>
        </div>
      </div>
    </>
  );
}
