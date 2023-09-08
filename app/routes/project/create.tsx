import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { generateProjectSlug } from "~/utils";
import { checkIdentityOrThrow, createProjectOnProfile } from "./utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  projectName: z.string().min(1, "Bitte gib den Namen Deines Projekts ein."),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  return json({ userId: sessionUser.id }, { headers: response.headers });
};

const mutation = makeDomainFunction(schema)(async (values) => {
  const slug = generateProjectSlug(values.projectName);
  return { ...values, slug };
});

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  if (result.success) {
    await createProjectOnProfile(
      sessionUser.id,
      result.data.projectName,
      result.data.slug
    );
    return redirect(`/project/${result.data.slug}`, {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <section className="container md:mt-2">
        <div className="font-semi text-neutral-600 flex items-center">
          {/* TODO: get back route from loader */}
          <button onClick={() => navigate(-1)} className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="h-auto w-6"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span className="ml-2">Zurück</span>
          </button>
        </div>
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <h4 className="font-semibold">Projekt hinzufügen</h4>
            <div className="pt-10 lg:pt-0">
              <RemixForm
                method="post"
                schema={schema}
                hiddenFields={["userId"]}
                values={{ userId: loaderData.userId }}
                onTransition={({ reset, formState }) => {
                  if (formState.isSubmitSuccessful) {
                    reset();
                  }
                }}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <Field name="projectName" className="mb-4">
                      {({ Errors }) => (
                        <>
                          <Input
                            id="projectName"
                            label="Name des Projekts*"
                            {...register("projectName")}
                          />
                          <Errors />
                        </>
                      )}
                    </Field>
                    <Field name="userId" />
                    <button
                      type="submit"
                      className="btn btn-outline-primary ml-auto btn-small mb-8"
                    >
                      Anlegen
                    </button>
                    <Errors />
                  </>
                )}
              </RemixForm>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Create;
