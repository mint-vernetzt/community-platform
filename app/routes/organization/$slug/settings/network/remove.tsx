import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { NetworkMember } from ".";
import { deriveOrganizationMode } from "../../utils.server";
import {
  disconnectOrganizationFromNetwork,
  getOrganizationIdBySlug,
} from "../utils.server";
import { detectLanguage } from "~/i18n.server";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";
import { type RemoveOrganizationNetworkMemberLocales } from "./remove.server";
import { languageModuleMap } from "~/locales/.server";

const schema = z.object({
  organizationId: z.string().uuid(),
});

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (locales: RemoveOrganizationNetworkMemberLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const { organizationId } = values;

    const network = await getOrganizationIdBySlug(environment.slug);
    if (network === null) {
      throw locales.route.error.notFound;
    }

    await disconnectOrganizationFromNetwork(organizationId, network.id);

    return values;
  });
};

export const loader = async () => {
  return redirect(".");
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/network/remove"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { slug: slug },
  });

  return { result, locales };
};

export function NetworkMemberRemoveForm(
  props: Jsonify<NetworkMember & { slug: string }>
) {
  const fetcher = useFetcher<typeof action>();
  const locales = fetcher.data !== undefined ? fetcher.data.locales : undefined;
  const { networkMember, slug } = props;

  return (
    <RemixFormsForm
      method="post"
      key={`${networkMember.slug}`}
      action={`/organization/${slug}/settings/network/remove`}
      schema={schema}
      hiddenFields={["organizationId"]}
      values={{ organizationId: networkMember.id }}
      fetcher={fetcher}
    >
      {({ Field, Button, Errors }) => {
        const initials = getInitialsOfName(networkMember.name);
        return (
          <div className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 @md:mv-px-4">
            <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
              {networkMember.logo !== null && networkMember.logo !== "" ? (
                <Avatar
                  name={networkMember.name}
                  logo={networkMember.logo}
                  blurredLogo={networkMember.blurredLogo}
                  size="full"
                />
              ) : (
                <>{initials}</>
              )}
            </div>
            <div className="pl-4">
              <Link to={`/organization/${networkMember.slug}`}>
                <H3
                  like="h4"
                  className="text-xl mb-1 no-underline hover:underline"
                >
                  {networkMember.name}
                </H3>
              </Link>
              {networkMember.types.length !== 0 ? (
                <p className="font-bold text-sm cursor-default">
                  {networkMember.types
                    .map((relation) => {
                      let title;
                      if (locales === undefined) {
                        return relation.organizationType.slug;
                      }
                      if (
                        relation.organizationType.slug in
                        locales.organizationTypes
                      ) {
                        type LocaleKey = keyof typeof locales.organizationTypes;
                        title =
                          locales.organizationTypes[
                            relation.organizationType.slug as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Organization type ${relation.organizationType.slug} not found in locales`
                        );
                        title = relation.organizationType.slug;
                      }
                      return title;
                    })
                    .join(" / ")}
                </p>
              ) : null}
            </div>
            <Button
              className="ml-auto btn-none"
              title={locales !== undefined ? locales.route.remove : "Remove"}
            >
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
            <Errors />
          </div>
        );
      }}
    </RemixFormsForm>
  );
}
