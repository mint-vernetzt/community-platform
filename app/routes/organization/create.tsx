import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigate } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import { getImageURL } from "~/images.server";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils.server";
import { getOrganizationByName } from "./$slug/settings/utils.server";
import { createOrganizationOnProfile } from "./create.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  organizationName: z
    .string()
    .min(1, "Bitte gib den Namen Deiner Organisation ein."),
});

const environmentSchema = z.object({
  userId: z.string(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  await getSessionUserOrThrow(authClient);

  return json({}, { headers: response.headers });
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const slug = generateOrganizationSlug(values.organizationName);
  try {
    await createOrganizationOnProfile(
      environment.userId,
      values.organizationName,
      slug
    );
  } catch (error) {
    throw "Diese Organisation existiert bereits. Melde dich bei der Person, die diese Organisation hier angelegt hat. Sie kann dich als Mitglied hinzufügen. Zukünftig wirst du dich selbstständig zu Organisationen hinzufügen können.";
  }
  return { ...values, slug };
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { userId: sessionUser.id },
  });
  let alreadyExistingOrganization: Awaited<
    ReturnType<typeof getOrganizationByName>
  > = null;
  if (result.success) {
    return redirect(`/organization/${result.data.slug}`, {
      headers: response.headers,
    });
  } else {
    if (
      result.errors._global !== undefined &&
      result.errors._global.includes(
        "Diese Organisation existiert bereits. Melde dich bei der Person, die diese Organisation hier angelegt hat. Sie kann dich als Mitglied hinzufügen. Zukünftig wirst du dich selbstständig zu Organisationen hinzufügen können."
      )
    ) {
      alreadyExistingOrganization = await getOrganizationByName(
        result.values.organizationName
      );
      if (
        alreadyExistingOrganization !== null &&
        alreadyExistingOrganization.logo !== null
      ) {
        const publicURL = getPublicURL(
          authClient,
          alreadyExistingOrganization.logo
        );
        if (publicURL) {
          alreadyExistingOrganization.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
    }
  }
  return json(
    { ...result, alreadyExistingOrganization },
    { headers: response.headers }
  );
};

export default function Create() {
  const actionData = useActionData<typeof action>();
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
            <h4 className="font-semibold">
              Organisation oder Netzwerk hinzufügen
            </h4>
            <div className="pt-10 lg:pt-0">
              <RemixFormsForm
                method="post"
                schema={schema}
                onTransition={({ reset, formState }) => {
                  if (formState.isSubmitSuccessful) {
                    reset();
                  }
                }}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <Field name="organizationName" className="mb-4">
                      {({ Errors }) => (
                        <>
                          <Input
                            id="organizationName"
                            label="Name der Organisation*"
                            {...register("organizationName")}
                          />
                          <Errors />
                        </>
                      )}
                    </Field>

                    <button
                      type="submit"
                      className="btn btn-outline-primary ml-auto btn-small mb-8"
                    >
                      Anlegen
                    </button>
                    <Errors />
                  </>
                )}
              </RemixFormsForm>
              {actionData !== undefined &&
              !actionData.success &&
              actionData.alreadyExistingOrganization !== null ? (
                <div className="pt-4 -mx-4">
                  <OrganizationCard
                    id="already-existing-organization"
                    link={`/organization/${actionData.alreadyExistingOrganization.slug}`}
                    name={actionData.alreadyExistingOrganization.name}
                    types={actionData.alreadyExistingOrganization.types}
                    image={actionData.alreadyExistingOrganization.logo}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
