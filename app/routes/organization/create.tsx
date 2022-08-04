import { ActionFunction, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, formAction } from "remix-forms";
import { forbidden } from "remix-utils";
import { z } from "zod";
import { getUserByRequest } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import useCSRF from "~/lib/hooks/useCSRF";
import { createOrganizationOnProfile } from "~/profile.server";
import { generateOrganizationSlug } from "~/utils";
import { validateCSRFToken } from "~/utils.server";

const schema = z.object({
  csrf: z.string(),
  id: z.string().uuid(),
  organizationName: z
    .string()
    .min(1, "Bitte gib den Namen Deiner Organisation ein."),
});

type LoaderData = {
  id: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await getUserByRequest(request);
  if (currentUser === null) {
    throw forbidden({ message: "not allowed" });
  }

  return { id: currentUser.id };
};

const mutation = makeDomainFunction(schema)(async (values) => {
  const slug = generateOrganizationSlug(values.organizationName);
  try {
    await createOrganizationOnProfile(values.id, values.organizationName, slug);
  } catch (error) {
    throw "Es existiert bereits eine Organisation mit diesem Namen.";
  }
  return values;
});

export const action: ActionFunction = async ({ request, params }) => {
  const currentUser = await getUserByRequest(request);

  const requestClone = request.clone();
  const formData = await requestClone.formData();
  const formUserId = formData.get("id");

  await validateCSRFToken(request);

  if (currentUser === null || formUserId !== currentUser.id) {
    throw forbidden({ message: "not allowed" });
  }

  const organizationName = formData.get("organizationName");
  let slug = "";
  if (organizationName !== null) {
    slug = generateOrganizationSlug(organizationName as string);
  }
  const formActionResult = formAction({
    request,
    schema,
    mutation,
    successPath: `/organization/${slug}`,
  });
  return formActionResult;
};

export default function Create() {
  const loaderData = useLoaderData<LoaderData>();
  const { hiddenCSRFInput } = useCSRF();

  return (
    <>
      <div className="container relative pb-44">
        <h4 className="font-semibold">
          Organisation, Netzwerk oder Projekt hinzufügen
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
                <Field name="id">
                  {({ Errors }) => (
                    <>
                      <input
                        type="hidden"
                        value={loaderData.id}
                        {...register("id")}
                      ></input>
                      <Errors />
                    </>
                  )}
                </Field>
                <Field name="csrf">
                  {({ Errors }) => (
                    <>
                      {hiddenCSRFInput}
                      <Errors />
                    </>
                  )}
                </Field>
                <button
                  type="submit"
                  className="btn btn-outline-primary ml-auto btn-small"
                >
                  Anlegen
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
