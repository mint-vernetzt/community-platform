import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import { detectLanguage } from "~/i18n.server";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getNetworkMembersOfOrganization,
  getOrganizationIdBySlug,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";
import { languageModuleMap } from "~/locales/.server";

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

export type NetworkMemberSuggestions =
  | Awaited<ReturnType<typeof getOrganizationSuggestionsForAutocomplete>>
  | undefined;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/network/index"];

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  const organization = await getOrganizationIdBySlug(slug);
  invariantResponse(organization, locales.error.notFound, { status: 404 });

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

  return { networkMembers, networkMemberSuggestions, locales };
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>
      <p className="mb-8">{locales.content.intro}</p>
      <Add networkMemberSuggestions={loaderData.networkMemberSuggestions} />
      <h4 className="mb-4 mt-16 font-semibold">
        {locales.content.current.headline}
      </h4>
      <p className="mb-8">{locales.content.current.intro} </p>
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
