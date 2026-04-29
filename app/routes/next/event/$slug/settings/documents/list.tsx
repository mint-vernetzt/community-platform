import { useEffect, useState } from "react";
import {
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getDocumentsOfEvent } from "./list.server";
import {
  getSearchDocumentsSchema,
  SEARCH_DOCUMENTS_SEARCH_PARAM,
} from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/list"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, documents } = await getDocumentsOfEvent({
    slug: params.slug,
    searchParams,
  });

  if (documents.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/documents/add`);
  }

  return { locales, submission, documents };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/list"];

  // TODO: Remove and update document intents
  // const event = await getEventBySlug(params.slug);
  // invariantResponse(event !== null, "Event not found", { status: 404 });

  // const formData = await request.formData();
  // const submission = await parseWithZod(formData, {
  //   schema: getRemoveSpeakerSchema(),
  // });

  // if (submission.status !== "success") {
  //   return submission.reply();
  // }

  // try {
  //   await removeSpeakerFromEvent({
  //     speakerId: submission.value.speakerId,
  //     eventId: event.id,
  //     locales: locales.route,
  //   });
  // } catch (error) {
  //   captureException(error);
  //   return redirectWithToast(request.url, {
  //     id: "remove-speaker-error",
  //     key: `remove-speaker-error-${Date.now()}`,
  //     message: locales.route.errors.removeSpeakerFailed,
  //     level: "negative",
  //   });
  // }

  // return redirectWithToast(request.url, {
  //   id: "remove-speaker-success",
  //   key: `remove-speaker-success-${Date.now()}`,
  //   message: locales.route.success.removeSpeaker,
  //   level: "positive",
  // });
}

function DocumentsList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;
  const [documents, setDocuments] = useState(loaderData.documents);

  useEffect(() => {
    setDocuments(loaderData.documents);
  }, [loaderData.documents]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="documents-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.documents}
          setValues={setDocuments}
          searchParam={SEARCH_DOCUMENTS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchDocumentsSchema()}
        />
        {documents.map((document, index) => {
          return (
            <></>
            // TODO: ListItemMaterial, OverlayMenu, Edit Modal
            // <ListItemPersonOrg
            //   key={speaker.id}
            //   index={index}
            //   //to={`/profile/${speaker.username}`} // TODO: link and controls currently not supported by component
            // >
            //   <ListItemPersonOrg.Avatar size="full" {...speaker} />
            //   <ListItemPersonOrg.Headline>
            //     {speaker.academicTitle !== null &&
            //     speaker.academicTitle.length > 0
            //       ? `${speaker.academicTitle} `
            //       : ""}
            //     {speaker.firstName} {speaker.lastName}
            //   </ListItemPersonOrg.Headline>
            //   <ListItemPersonOrg.Controls>
            //     <Form
            //       id={`remove-speaker-form-${speaker.id}`}
            //       method="POST"
            //       preventScrollReset
            //     >
            //       <input type="hidden" name="speakerId" value={speaker.id} />
            //       <Button type="submit" variant="outline">
            //         {locales.route.list.remove}
            //       </Button>
            //     </Form>
            //   </ListItemPersonOrg.Controls>
            // </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default DocumentsList;
