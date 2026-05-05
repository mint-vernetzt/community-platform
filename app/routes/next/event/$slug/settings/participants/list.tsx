import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { Deep, extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventBySlug,
  getParticipantsOfEvent,
  removeParticipantFromEvent,
} from "./list.server";
import {
  getConfirmationModalSearchParam,
  getRemoveParticipantSchema,
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", { status: 400 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/participants/list"];

  const { authClient } = createAuthClient(request);

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const result = await getParticipantsOfEvent({
    eventId: event.id,
    authClient,
    searchParams,
  });
  const { submission, participants } = result;

  if (participants.length === 0) {
    return redirect(`../add?${Deep}=true`);
  }

  return { locales, language, participants, submission };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;

  const { slug } = params;
  invariantResponse(typeof slug === "string", "Invalid slug", { status: 400 });

  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/participants/list"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: getRemoveParticipantSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const url = new URL(request.url);
  url.searchParams.delete(
    getConfirmationModalSearchParam(submission.value.participantId)
  );

  try {
    await removeParticipantFromEvent({
      participantId: submission.value.participantId,
      eventId: event.id,
      locales: {
        mail: {
          subject: locales.route.mail.removeParticipant.subject,
        },
      },
    });

    return redirectWithToast(url.toString(), {
      id: "remove-participant-success",
      key: `remove-participant-success-${Date.now()}`,
      message: locales.route.success.removeParticipant,
      level: "positive",
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(url.toString(), {
      id: "remove-participant-error",
      key: `remove-participant-error-${Date.now()}`,
      message: locales.route.errors.removeParticipant,
      level: "negative",
    });
  }
}

function ParticipantsList() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const [participants, setParticipants] = useState(loaderData.participants);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.list.title}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.list.subline}
        </TitleSection.Subline>
      </TitleSection>
      <List id="participants-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.participants}
          setValues={setParticipants}
          searchParam={SEARCH_PARTICIPANTS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.search.placeholder,
          }}
          hideUntil={4}
          label={locales.route.list.search.label}
          submission={loaderData.submission}
          schema={getSearchParticipantsSchema()}
        />
        {participants.map((participant, index) => {
          const confirmModalSearchParam = getConfirmationModalSearchParam(
            participant.id
          );

          return (
            <ListItemPersonOrg
              key={participant.id}
              index={index}
              // to={`/profile/${participant.username}`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...participant} />
              <ListItemPersonOrg.Headline>
                {participant.academicTitle !== null &&
                participant.academicTitle.length > 0
                  ? `${participant.academicTitle} `
                  : ""}
                {participant.firstName} {participant.lastName}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Subline>
                {insertParametersIntoLocale(locales.route.list.item.subline, {
                  date: new Date(participant.createdAt).toLocaleDateString(
                    language,
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }
                  ),
                })}
              </ListItemPersonOrg.Subline>
              <ListItemPersonOrg.Controls>
                <Button
                  variant="outline"
                  as="link"
                  to={`?${extendSearchParams(searchParams, { addOrReplace: { [confirmModalSearchParam]: "true" } }).toString()}`}
                  preventScrollReset
                >
                  {locales.route.list.item.remove}
                </Button>
                <Form
                  id={`remove-participant-form-${participant.id}`}
                  method="POST"
                  preventScrollReset
                  hidden
                >
                  <input name="participantId" defaultValue={participant.id} />
                </Form>
                <Modal searchParam={confirmModalSearchParam}>
                  <Modal.Title>
                    {insertParametersIntoLocale(
                      locales.route.list.confirmation.title,
                      {
                        firstName: participant.firstName,
                        lastName: participant.lastName,
                      }
                    )}
                  </Modal.Title>
                  <Modal.Section>
                    {locales.route.list.confirmation.description}
                  </Modal.Section>
                  <Modal.SubmitButton
                    form={`remove-participant-form-${participant.id}`}
                    level="negative"
                  >
                    {locales.route.list.confirmation.submit}
                  </Modal.SubmitButton>
                  <Modal.CloseButton route={location.pathname}>
                    {locales.route.list.confirmation.abort}
                  </Modal.CloseButton>
                </Modal>
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.download.title}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.download.subline}
        </TitleSection.Subline>
      </TitleSection>
      <Hint>
        {insertComponentsIntoLocale(locales.route.download.hint, [
          <span key="privacy-notice" className="font-semibold" />,
          <Link
            key="privacy-policy"
            to="/privacy-policy"
            target="_blank"
            className="underline font-semibold"
          />,
          <Link
            key="terms-of-use"
            to="/terms-of-use"
            target="_blank"
            className="underline font-semibold"
          />,
        ])}
      </Hint>
      <div className="flex justify-end">
        <div className="w-full md:w-fit">
          <Button
            as="link"
            to="../list-download"
            variant="outline"
            reloadDocument
            fullSize
          >
            {locales.route.download.action}
          </Button>
        </div>
      </div>
    </>
  );
}

export default ParticipantsList;
