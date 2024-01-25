import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getNetworkMembersOfOrganization,
  getOrganizationIdBySlug,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/organization/settings/network/index"];
export const handle = {
  i18n: i18nNS,
};

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

export type NetworkMemberSuggestions =
  | Awaited<ReturnType<typeof getOrganizationSuggestionsForAutocomplete>>
  | undefined;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/network/index",
  ]);

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
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

  return json(
    { networkMembers, networkMemberSuggestions },
    { headers: response.headers }
  );
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
      <div className="mb-4 md:max-h-[630px] overflow-auto">
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
