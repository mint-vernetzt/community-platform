import {
  ActionFunction,
  LoaderFunction,
  redirect,
  useFetcher,
  useParams,
} from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form, PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import {
  connectOrganizationToNetwork,
  getOrganizationByName,
  getOrganizationIdBySlug,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  name: z.string(),
  slug: z.string(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { name, slug } = values;

  const network = await getOrganizationIdBySlug(slug);
  if (network === null) {
    throw "Eure Organisation konnte nicht gefunden werden.";
  }

  const organization = await getOrganizationByName(name);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation unter diesem Namen.",
      "name"
    );
  }

  if (network.id === organization.id) {
    throw new InputError(
      "Eure Organisation ist bereits Teil Eures Netzwerks.",
      "name"
    );
  }

  const stillMember = organization.memberOf.some((entry) => {
    return entry.network.slug === slug;
  });

  if (stillMember) {
    throw new InputError(
      "Die angegebene Organisation ist bereits Teil Eures Netzwerks.",
      "name"
    );
  }

  const result = await connectOrganizationToNetwork(
    organization.id,
    network.id
  );
  if (result === null) {
    throw "Die Organisation konnte leider nicht Eurem Netzwerk hinzugefügt werden.";
  }

  return values;
});

export const loader: LoaderFunction = async () => {
  return redirect(".");
};

type ActionData = {
  result?: PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;
  message?: string;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await handleAuthorization(args);

  const result = await performMutation({ request, schema, mutation });
  if (result.success) {
    return {
      message: `Die Organisation "${result.data.name}" ist jetzt Teil Eures Netzwerks.`,
    };
  }

  return result;
};

function Add() {
  const { slug } = useParams();
  const fetcher = useFetcher<ActionData>();

  return (
    <>
      <h4 className="mb-4 font-semibold">Netzwerkmitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurem Netzwerk eine bereits bestehende Organisation hinzu.
      </p>
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
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="name" className="label">
                    Name der Organisation
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="name" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <input
                        id="name"
                        name="name"
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
