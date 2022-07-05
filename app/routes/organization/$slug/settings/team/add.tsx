import {
  ActionFunction,
  json,
  LoaderFunction,
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
} from "./utils.server";

const schema = z.object({
  email: z.string().email(),
  slug: z.string(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { email, slug } = values;

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

export const loader: LoaderFunction = async (args) => {
  console.log("add loading");
  return null;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;
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
      <h1>Teammitglied hinzufügen</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      {fetcher?.data?.message && <strong>{fetcher.data.message}</strong>}
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
            <>
              <Field name="email" />
              <Field name="slug" />
              <Errors />
              <Button />
            </>
          );
        }}
      </Form>
    </>
  );
}

export default Add;
