import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import { detectLanguage } from "~/root.server";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getNetworkMembersOfOrganization,
  getOrganizationIdBySlug,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";

const i18nNS = [
  "routes/organization/settings/network/index",
  "routes/organization/settings/network/add",
  "datasets/organizationTypes",
];

export const handle = {
  i18n: i18nNS,
};

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

export type NetworkMemberSuggestions =
  | Awaited<ReturnType<typeof getOrganizationSuggestionsForAutocomplete>>
  | undefined;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/network/index",
  ]);

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const organization = await getOrganizationIdBySlug(slug);
  invariantResponse(organization, t("error.notFound"), { status: 404 });

  const networkMembers = await getNetworkMembersOfOrganization(
    authClient,
    organization.id
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let networkMemberSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyMemberSlugs = networkMembers.map((member) => {
      return member.networkMember.slug;
    });
    networkMemberSuggestions = await getOrganizationSuggestionsForAutocomplete(
      authClient,
      [...alreadyMemberSlugs, slug],
      query
    );
  }

  return json({ networkMembers, networkMemberSuggestions });
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-8">{t("content.intro")}</p>
      <Add networkMemberSuggestions={loaderData.networkMemberSuggestions} />
      <h4 className="mb-4 mt-16 font-semibold">
        {t("content.current.headline")}
      </h4>
      <p className="mb-8">{t("content.current.intro")} </p>
      <div className="mb-4 @md:mv-max-h-[630px] overflow-auto">
        {loaderData.networkMembers.map((member) => {
          return (
            <NetworkMemberRemoveForm
              key={member.networkMember.id}
              {...member}
              slug={slug || ""}
            />
          );
        })}
      </div>
    </>
  );
}

export default Index;
