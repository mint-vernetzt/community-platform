import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { Form } from "remix-forms";
import { createAuthClient } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { getInitials } from "~/lib/profile/getInitials";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { type action as addMemberAction } from "./team/add-member";
import { addMemberSchema } from "./team/add-member";
import { type action as removeMemberAction } from "./team/remove-member";
import { removeMemberSchema } from "./team/remove-member";
import { handleAuthorization } from "./utils.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getMembersOfOrganization } from "./team.server";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");
  const { organization, sessionUser } = await handleAuthorization(
    authClient,
    slug
  );

  const members = await getMembersOfOrganization(authClient, organization.id);
  const enhancedMembers = members.map((relation) => {
    return relation.profile;
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let memberSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyMemberIds = members.map((member) => {
      return member.profile.id;
    });
    memberSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyMemberIds,
      query
    );
  }

  return json(
    {
      members: enhancedMembers,
      memberSuggestions,
      userId: sessionUser.id,
      organizationId: organization.id,
      slug: slug,
    },
    { headers: response.headers }
  );
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addMemberFetcher = useFetcher<typeof addMemberAction>();
  const removeMemberFetcher = useFetcher<typeof removeMemberAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Das Team</h1>
      <p className="mb-8">
        Wer ist Teil Eurer Organisation? Füge hier weitere Teammitglieder hinzu
        oder entferne sie.
      </p>
      <h4 className="mb-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurer Organisation ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addMemberSchema}
        fetcher={addMemberFetcher}
        action={`/organization/${slug}/settings/team/add-member`}
        hiddenFields={["userId"]}
        values={{
          userId: loaderData.userId,
        }}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/team`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="Name" className="label">
                    Name oder Email
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="profileId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Errors />
                      <Autocomplete
                        suggestions={loaderData.memberSuggestions || []}
                        suggestionsLoaderPath={`/organization/${slug}/settings/team`}
                        defaultValue={suggestionsQuery || ""}
                        {...register("profileId")}
                        searchParameter="autocomplete_query"
                      />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                </div>
              </div>
              <Field name="userId" />
            </div>
          );
        }}
      </Form>
      {addMemberFetcher.data !== undefined &&
      "message" in addMemberFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addMemberFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">Aktuelle Teammitglieder</h4>
      <p className="mb-8">
        Hier siehst du alle Teammitglieder auf einen Blick.{" "}
      </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        {loaderData.members.map((profile) => {
          const initials = getInitials(profile);
          return (
            <div
              key={`team-member-${profile.id}`}
              className="w-full flex items-center flex-row flex-wrap sm:flex-nowrap border-b border-neutral-400 py-4 md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {profile.avatar !== null && profile.avatar !== "" ? (
                  <img src={profile.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${profile.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {profile.firstName} {profile.lastName}
                  </H3>
                </Link>
                {profile.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {profile.position}
                  </p>
                ) : null}
              </div>
              <div className="flex-100 sm:flex-auto sm:ml-auto flex items-center flex-row pt-4 sm:pt-0 justify-end">
                <Form
                  method="post"
                  action={`/organization/${slug}/settings/team/remove-member`}
                  schema={removeMemberSchema}
                  hiddenFields={["profileId", "userId"]}
                  values={{
                    profileId: profile.id,
                    userId: loaderData.userId,
                  }}
                  fetcher={removeMemberFetcher}
                >
                  {({ Field, Button, Errors }) => {
                    return (
                      <>
                        {loaderData.members.length > 1 ? (
                          <Button
                            className="ml-auto btn-none"
                            title="entfernen"
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
                        ) : null}
                        <Field name="userId" />
                        <Field name="profileId" />
                        <Errors />
                      </>
                    );
                  }}
                </Form>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Index;
