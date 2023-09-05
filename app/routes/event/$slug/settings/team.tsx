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
import { GravityType } from "imgproxy/dist/types";
import { Form, Form as RemixForm } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { getEvent } from "./team.server";
import {
  addMemberSchema,
  type action as addMemberAction,
} from "./team/add-member";
import {
  removeMemberSchema,
  type action as removeMemberAction,
} from "./team/remove-member";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEvent(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const enhancedTeamMembers = event.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { ...relation.profile, avatar };
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let teamMemberSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyTeamMemberIds = event.teamMembers.map((relation) => {
      return relation.profile.id;
    });
    teamMemberSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyTeamMemberIds,
      query
    );
  }

  return json(
    {
      eventId: event.id,
      published: event.published,
      teamMembers: enhancedTeamMembers,
      teamMemberSuggestions,
    },
    { headers: response.headers }
  );
};

function Team() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addMemberFetcher = useFetcher<typeof addMemberAction>();
  const removeMemberFetcher = useFetcher<typeof removeMemberAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Das Team</h1>
      <p className="mb-8">
        Wer ist Teil Eures Veranstaltungsteams? Füge hier weitere Teammitglieder
        hinzu oder entferne sie.
      </p>
      <h4 className="mb-4 mt-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addMemberSchema}
        fetcher={addMemberFetcher}
        action={`/event/${slug}/settings/team/add-member`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/team`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <div className="form-control w-full">
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
                          suggestions={loaderData.teamMemberSuggestions || []}
                          suggestionsLoaderPath={`/event/${slug}/settings/team`}
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
              </div>
            </>
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
        Hier siehst du alle Mitglieder des Veranstaltungsteams auf einen Blick.{" "}
      </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        {loaderData.teamMembers.map((teamMember) => {
          const initials = getInitials(teamMember);
          return (
            <div
              key={`team-member-${teamMember.id}`}
              className="w-full flex items-center flex-row flex-wrap sm:flex-nowrap border-b border-neutral-400 py-4 md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {teamMember.avatar !== null && teamMember.avatar !== "" ? (
                  <img src={teamMember.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${teamMember.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {teamMember.firstName} {teamMember.lastName}
                  </H3>
                </Link>
                {teamMember.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {teamMember.position}
                  </p>
                ) : null}
              </div>
              <div className="flex-100 sm:flex-auto sm:ml-auto flex items-center flex-row pt-4 sm:pt-0 justify-end">
                <Form
                  schema={removeMemberSchema}
                  fetcher={removeMemberFetcher}
                  action={`/event/${slug}/settings/team/remove-member`}
                  hiddenFields={["profileId"]}
                  values={{
                    profileId: teamMember.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button, Errors } = props;
                    return (
                      <>
                        <Errors />
                        <Field name="profileId" />
                        {loaderData.teamMembers.length > 1 ? (
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
                      </>
                    );
                  }}
                </Form>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["eventId", "publish"]}
              values={{
                eventId: loaderData.eventId,
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="eventId" />
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published ? "Verstecken" : "Veröffentlichen"}
                    </Button>
                  </>
                );
              }}
            </RemixForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Team;
