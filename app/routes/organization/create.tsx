import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import { getImageURL } from "~/images.server";
import { createOrganizationOnProfile } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils";
import { getOrganizationByName } from "./$slug/settings/utils.server";
import { checkIdentityOrThrow } from "./$slug/utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  organizationName: z
    .string()
    .min(1, "Bitte gib den Namen Deiner Organisation ein."),
});

type LoaderData = {
  id: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const currentUser = await getSessionUserOrThrow(authClient);

  return json<LoaderData>(
    { id: currentUser.id },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(schema)(async (values) => {
  const slug = generateOrganizationSlug(values.organizationName);
  try {
    await createOrganizationOnProfile(
      values.userId,
      values.organizationName,
      slug
    );
  } catch (error) {
    throw "Diese Organisation existiert bereits. Melde dich bei der Person, die diese Organisation hier angelegt hat. Sie kann dich als Mitglied hinzufügen. Zukünftig wirst du dich selbstständig zu Organisationen hinzufügen können.";
  }
  return { ...values, slug };
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>> & {
  alreadyExistingOrganization: Awaited<
    ReturnType<typeof getOrganizationByName>
  >;
};

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
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
  return json<ActionData>(
    { ...result, alreadyExistingOrganization },
    { headers: response.headers }
  );
};

export default function Create() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
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
              <RemixForm
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
                            label="Name der Organisation"
                            {...register("organizationName")}
                          />
                          <Errors />
                        </>
                      )}
                    </Field>
                    <Field name="userId">
                      {({ Errors }) => (
                        <>
                          <input
                            type="hidden"
                            value={loaderData.id}
                            {...register("userId")}
                          ></input>
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
              </RemixForm>
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
