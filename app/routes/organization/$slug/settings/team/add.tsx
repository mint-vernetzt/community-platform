import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useFetcher,
  useParams,
} from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";

import {
  connectProfileToOrganization,
  getOrganizationBySlug,
  getProfileByEmail,
  handleAuthorization,
} from "./../utils.server";

const schema = z.object({
  email: z.string().email(),
  slug: z.string(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { email, slug } = values;
  // TODO: Duplicate code - see utils.server.ts handleAuthorization()
  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw "Organization not found";
  }

  const profile = await getProfileByEmail(email);

  if (profile === null) {
    throw new InputError("Profile not found", "email");
  }

  const stillMember = profile.memberOf.some((entry) => {
    return entry.organization.slug === slug;
  });

  if (stillMember) {
    throw new InputError("User still member", "email");
  }

  const result = await connectProfileToOrganization(
    profile.id,
    organization.id
  );
  if (result === null) {
    throw "Couldn't add user as member";
  }

  return values;
});

export const loader: LoaderFunction = async () => {
  return redirect(".");
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await handleAuthorization(args);

  const result = await performMutation({ request, schema, mutation });

  if (result.success) {
    return json({
      message: `User with email "${result.data.email}" added as team member`,
    });
  }

  return result;
};
function Add() {
  const { slug } = useParams();
  const fetcher = useFetcher();

  return (
    <>
      <h4 className="mb-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      <Form
        schema={schema}
        fetcher={fetcher}
        action={`/organization/${slug}/settings/team/add`}
        hiddenFields={["slug"]}
        values={{ slug }}
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-email" htmlFor="Email" className="label">
                    E-Mail
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="email" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <input
                        id="email"
                        name="email"
                        className="input input-bordered w-full"
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                </div>
              </div>
              <Field name="slug" />
            </div>
          );
        }}
      </Form>
      {fetcher?.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {fetcher.data.message}
        </div>
      )}
    </>
  );
}

export default Add;
