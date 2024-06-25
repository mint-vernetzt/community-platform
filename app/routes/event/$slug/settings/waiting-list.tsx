import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { GravityType, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import {
  getEventBySlug,
  getParticipantsDataFromEvent,
} from "./waiting-list.server";
import {
  addToWaitingListSchema,
  type action as addToWaitingListAction,
} from "./waiting-list/add-to-waiting-list";
import {
  moveToParticipantsSchema,
  type action as moveToParticipantsAction,
} from "./waiting-list/move-to-participants";
import {
  removeFromWaitingListSchema,
  type action as removeFromWaitingListAction,
} from "./waiting-list/remove-from-waiting-list";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/event/settings/waiting-list",
  ]);
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const participants = getParticipantsDataFromEvent(event);
  const enhancedWaitingParticipants = participants.waitingList.map(
    (waitingParticipant) => {
      if (waitingParticipant.avatar !== null) {
        const publicURL = getPublicURL(authClient, waitingParticipant.avatar);
        if (publicURL !== null) {
          waitingParticipant.avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return waitingParticipant;
    }
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let waitingParticipantSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyParticipantIds = participants.participants.map(
      (participant) => {
        return participant.id;
      }
    );
    const alreadyWaitingParticipantIds = participants.waitingList.map(
      (waitingParticipant) => {
        return waitingParticipant.id;
      }
    );
    const alreadyParticipatingIds = [
      ...alreadyParticipantIds,
      ...alreadyWaitingParticipantIds,
    ];
    waitingParticipantSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyParticipatingIds,
      query
    );
  }

  const fullDepthWaitingList = await getFullDepthProfiles(
    event.id,
    "waitingList"
  );

  return json({
    published: event.published,
    waitingList: enhancedWaitingParticipants,
    waitingParticipantSuggestions,
    hasFullDepthWaitingList:
      fullDepthWaitingList !== null &&
      fullDepthWaitingList.length > 0 &&
      event._count.childEvents !== 0,
  });
};

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addToWaitingListFetcher = useFetcher<typeof addToWaitingListAction>();
  const removeFromWaitingListFetcher =
    useFetcher<typeof removeFromWaitingListAction>();
  const moveToParticipantsFetcher =
    useFetcher<typeof moveToParticipantsAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(["routes/event/settings/waiting-list"]);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-8">{t("content.intro")}</p>
      <h4 className="mb-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <RemixFormsForm
        schema={addToWaitingListSchema}
        fetcher={addToWaitingListFetcher}
        action={`/event/${slug}/settings/waiting-list/add-to-waiting-list`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/waiting-list`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      {t("content.add.label")}
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="profileId" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={
                            loaderData.waitingParticipantSuggestions || []
                          }
                          suggestionsLoaderPath={`/event/${slug}/settings/waiting-list`}
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
      </RemixFormsForm>
      {addToWaitingListFetcher.data !== undefined &&
      "message" in addToWaitingListFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addToWaitingListFetcher.data.message}
        </div>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">
            {t("content.current.headline")}
          </h4>
          <p className="mb-4">{t("content.current.intro")}</p>
        </>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=waitingList&amp;depth=single"
            reloadDocument
          >
            {t("content.current.download1")}
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthWaitingList ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=waitingList&amp;depth=full"
            reloadDocument
          >
            {t("content.current.download2")}
          </Link>
        </p>
      ) : null}

      {moveToParticipantsFetcher.data !== undefined &&
        "success" in moveToParticipantsFetcher.data &&
        moveToParticipantsFetcher.data.success === true && (
          <div>{t("content.current.feedback")}</div>
        )}
      {loaderData.waitingList.length > 0 ? (
        <div className="mb-4 mt-8 @md:mv-max-h-[630px] overflow-auto">
          {loaderData.waitingList.map((waitingParticipant) => {
            const initials = getInitials(waitingParticipant);
            return (
              <div
                key={waitingParticipant.id}
                className="w-full flex items-center flex-row flex-wrap @sm:mv-flex-nowrap border-b border-neutral-400 py-4 @md:mv-px-4"
              >
                <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                  {waitingParticipant.avatar !== null &&
                  waitingParticipant.avatar !== "" ? (
                    <img src={waitingParticipant.avatar} alt={initials} />
                  ) : (
                    <>{initials}</>
                  )}
                </div>
                <div className="pl-4">
                  <Link to={`/profile/${waitingParticipant.username}`}>
                    <H3
                      like="h4"
                      className="text-xl mb-1 no-underline hover:underline"
                    >
                      {waitingParticipant.firstName}{" "}
                      {waitingParticipant.lastName}
                    </H3>
                  </Link>
                  {waitingParticipant.position ? (
                    <p className="font-bold text-sm cursor-default">
                      {waitingParticipant.position}
                    </p>
                  ) : null}
                </div>
                <div className="flex-100 @sm:mv-flex-auto @sm:mv-ml-auto flex items-center flex-row pt-4 @sm:mv-pt-0 justify-end">
                  <RemixFormsForm
                    schema={moveToParticipantsSchema}
                    fetcher={moveToParticipantsFetcher}
                    action={`/event/${slug}/settings/waiting-list/move-to-participants`}
                    hiddenFields={["profileId"]}
                    values={{
                      profileId: waitingParticipant.id,
                    }}
                    className="ml-auto"
                  >
                    {(props) => {
                      const { Field, Button, Errors } = props;
                      return (
                        <>
                          <Errors />
                          <Field name="profileId" />
                          <Button className="btn btn-outline-primary ml-auto btn-small">
                            {t("content.current.action")}
                          </Button>
                        </>
                      );
                    }}
                  </RemixFormsForm>
                  <RemixFormsForm
                    schema={removeFromWaitingListSchema}
                    fetcher={removeFromWaitingListFetcher}
                    action={`/event/${slug}/settings/waiting-list/remove-from-waiting-list`}
                    hiddenFields={["profileId"]}
                    values={{
                      profileId: waitingParticipant.id,
                    }}
                  >
                    {(props) => {
                      const { Field, Button, Errors } = props;
                      return (
                        <>
                          <Errors />
                          <Field name="profileId" />
                          <Button
                            className="ml-auto btn-none"
                            title={t("content.current.remove")}
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
                        </>
                      );
                    }}
                  </RemixFormsForm>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 @md:mv-pb-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px]">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published
                        ? t("content.hide")
                        : t("content.publish")}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Participants;
