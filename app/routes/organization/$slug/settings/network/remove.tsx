import {
  ActionFunction,
  LoaderFunction,
  redirect,
  useFetcher,
  useParams,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { NetworkMember } from ".";
import {
  disconnectOrganizationFromNetwork,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  organizationId: z.string().uuid(),
  networkId: z.string().uuid(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { organizationId, networkId } = values;

  await disconnectOrganizationFromNetwork(organizationId, networkId);

  return values;
});

export const loader: LoaderFunction = async () => {
  return redirect(".");
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await handleAuthorization(args);

  const result = await performMutation({ request, schema, mutation });

  return result;
};

export function NetworkMemberRemoveForm(
  props: NetworkMember & { slug: string }
) {
  const fetcher = useFetcher();

  const { networkMember, networkId, slug } = props;

  return (
    <Form
      method="post"
      key={`${networkMember.slug}`}
      action={`/organization/${slug}/settings/network/remove`}
      schema={schema}
      hiddenFields={["organizationId", "networkId"]}
      values={{ organizationId: networkMember.id, networkId }}
      fetcher={fetcher}
    >
      {({ Field, Button, Errors }) => {
        return (
          <>
            <p>{networkMember.name}</p>
            <Field name="organizationId" />
            <Field name="networkId" />
            <Errors />
            <Button>X</Button>
          </>
        );
      }}
    </Form>
  );
}
