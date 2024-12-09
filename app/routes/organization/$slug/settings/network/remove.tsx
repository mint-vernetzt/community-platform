import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
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
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { Avatar } from "@mint-vernetzt/components";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";

const i18nNS = [
  "routes-organization-settings-network-index",
  "routes-organization-settings-network-add",
  "datasets-organizationTypes",
] as const;
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  organizationId: z.string().uuid(),
});

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const { organizationId } = values;

    const network = await getOrganizationIdBySlug(environment.slug);
    if (network === null) {
      throw t("error.notFound");
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
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { slug: slug },
  });

  return json(result);
};

export function NetworkMemberRemoveForm(
  props: Jsonify<NetworkMember & { slug: string }>
) {
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation(i18nNS);
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
                      return t(`${relation.organizationType.slug}.title`, {
                        ns: "datasets-organizationTypes",
                      });
                    })
                    .join(" / ")}
                </p>
              ) : null}
            </div>
            <Button className="ml-auto btn-none" title={t("remove")}>
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
