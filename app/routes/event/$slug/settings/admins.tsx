import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { GravityType, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getEvent } from "./admins.server";
import {
  type action as addAdminAction,
  addAdminSchema,
} from "./admins/add-admin";
import {
  type action as removeAdminAction,
  removeAdminSchema,
} from "./admins/remove-admin";
import { type action as publishAction, publishSchema } from "./events/publish";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/event/settings/admins"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEvent(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const enhancedAdmins = event.admins.map((relation) => {
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
  let adminSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyAdminIds = event.admins.map((relation) => {
      return relation.profile.id;
    });
    adminSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyAdminIds,
      query
    );
  }

  return json({
    published: event.published,
    admins: enhancedAdmins,
    adminSuggestions,
  });
};

function Admins() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addAdminFetcher = useFetcher<typeof addAdminAction>();
  const removeAdminFetcher = useFetcher<typeof removeAdminAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-2">{t("content.intro.who")}</p>
      <p className="mb-2">{t("content.intro.what")}</p>
      <p className="mb-8">{t("content.intro.whom")}</p>
      <h4 className="mb-4 mt-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <RemixFormsForm
        schema={addAdminSchema}
        fetcher={addAdminFetcher}
        action={`/event/${slug}/settings/admins/add-admin`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/admins`,
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
                      {t("form.name.label")}
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="profileId" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={loaderData.adminSuggestions || []}
                          suggestionsLoaderPath={`/event/${slug}/settings/admins`}
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
      {addAdminFetcher.data !== undefined &&
      "message" in addAdminFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addAdminFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">
        {t("content.current.headline", { count: loaderData.admins.length })}
      </h4>
      <p className="mb-8">
        {t("content.current.intro", { count: loaderData.admins.length })}
      </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        {loaderData.admins.map((admin) => {
          const initials = getInitials(admin);
          return (
            <div
              key={`team-member-${admin.id}`}
              className="w-full flex items-center flex-row flex-wrap sm:flex-nowrap border-b border-neutral-400 py-4 md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {admin.avatar !== null && admin.avatar !== "" ? (
                  <img src={admin.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${admin.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {admin.firstName} {admin.lastName}
                  </H3>
                </Link>
                {admin.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {admin.position}
                  </p>
                ) : null}
              </div>
              <div className="flex-100 sm:flex-auto sm:ml-auto flex items-center flex-row pt-4 sm:pt-0 justify-end">
                <RemixFormsForm
                  schema={removeAdminSchema}
                  fetcher={removeAdminFetcher}
                  action={`/event/${slug}/settings/admins/remove-admin`}
                  hiddenFields={["profileId"]}
                  values={{
                    profileId: admin.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button, Errors } = props;
                    return (
                      <>
                        <Errors />
                        <Field name="profileId" />
                        {loaderData.admins.length > 1 ? (
                          <Button
                            className="ml-auto btn-none"
                            title={t("form.remove.label")}
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
                </RemixFormsForm>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
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
                        ? t("form.hide.label")
                        : t("form.publish.label")}
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

export default Admins;
