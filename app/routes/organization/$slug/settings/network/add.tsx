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
  connectOrganizationToNetwork,
  getOrganizationByName,
  getOrganizationBySlug,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  name: z.string(),
  slug: z.string(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { name, slug } = values;

  const network = await getOrganizationBySlug(slug);
  if (network === null) {
    throw "Network not found";
  }

  const organization = await getOrganizationByName(name);
  if (organization === null) {
    throw new InputError("Organization not found", "name");
  }

  const stillMember = organization.memberOf.some((entry) => {
    return entry.network.slug === slug;
  });

  if (stillMember) {
    throw new InputError("Organization still member", "name");
  }

  const result = await connectOrganizationToNetwork(
    organization.id,
    network.id
  );
  if (result === null) {
    throw "Couldn't add organization to network";
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
      message: `Organization with name "${result.data.name}" added as network member`,
    });
  }

  return result;
};

function Add() {
  const { slug } = useParams();
  const fetcher = useFetcher();

  return (
    <>
      <h1>Netzwerkmitglied hinzufügen</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      {fetcher?.data?.message && <strong>{fetcher.data.message}</strong>}
      <Form
        schema={schema}
        fetcher={fetcher}
        action={`/organization/${slug}/settings/network/add`}
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
              <Field name="name" />
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
