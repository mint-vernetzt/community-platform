import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { NetworkMember } from ".";
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

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();

  createAuthClient(request, response);
  return redirect(".", { headers: response.headers });
};

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  // TODO: Investigate: checkIdentityOrThrow is missing here but present in other actions

  const slug = getParamValueOrThrow(params, "slug");

  await handleAuthorization(authClient, slug);

  const result = await performMutation({ request, schema, mutation });

  return json<ActionData>(result, { headers: response.headers });
};

export function NetworkMemberRemoveForm(
  props: NetworkMember & { slug: string }
) {
  const fetcher = useFetcher<ActionData>();

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
          <div className="w-full flex items-center flex-row border-b border-neutral-400 p-4">
            {networkMember.logo !== "" && networkMember.logo !== null ? (
              <div className="h-16 w-16 flex items-center justify-center relative">
                <img
                  className="max-w-full w-auto max-h-16 h-auto"
                  src={networkMember.logo}
                  alt={networkMember.name}
                />
              </div>
            ) : (
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                {getInitialsOfName(networkMember.name)}
              </div>
            )}
            <div className="pl-4">
              <H3 like="h4" className="text-xl mb-1">
                {networkMember.name}
              </H3>
            </div>
            <Button className="ml-auto btn-none" title="entfernen">
              <svg
                viewBox="0 0 10 10"
                width="10px"
                height="10px"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
            <Field name="organizationId" />
            <Field name="networkId" />
            <Errors />
          </div>
        );
      }}
    </Form>
  );
}
