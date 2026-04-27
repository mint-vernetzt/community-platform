import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import {
  type ActionFunctionArgs,
  Form,
  useLoaderData,
  useSubmit,
  type LoaderFunctionArgs,
  useNavigation,
  useActionData,
  data,
  useLocation,
} from "react-router";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import {
  getEventBySlug,
  getEventIdBySlug,
  updateEventMoveUpToParticipants,
} from "./limit.server";
import { Checkbox } from "~/components-next/Checkbox";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import {
  createMoveUpToParticipantsSchema,
  UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT,
} from "./limit.shared";
import Hint from "~/components/next/Hint";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { createToastHeaders, redirectWithToast } from "~/toast.server";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { UnsavedChangesModalParam } from "~/lib/utils/searchParams";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/registration/limit"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const now = Date.now();

  return { locales, event, now };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const eventId = await getEventIdBySlug(slug);
  invariantResponse(eventId !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/registration/limit"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT,
    "Invalid intent",
    {
      status: 400,
    }
  );

  if (intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT) {
    const schema = createMoveUpToParticipantsSchema();
    const submission = await parseWithZod(formData, { schema });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await updateEventMoveUpToParticipants({
        eventId,
        moveUpToParticipants: submission.value.moveUpToParticipants,
      });
      return redirectWithToast(request.url, {
        id: "update-move-up-to-participants-success",
        key: `update-move-up-to-participants-success-${Date.now()}`,
        message: locales.route.success.moveUpToParticipants,
        level: "positive",
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "update-move-up-to-participants-error",
        key: `update-move-up-to-participants-error-${Date.now()}`,
        message: locales.route.errors.moveUpToParticipants,
        level: "negative",
      });
    }
  }
  return null;
}

function RegistrationLimit() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, event, now } = loaderData;

  const submit = useSubmit();
  const navigation = useNavigation();

  const [moveUpToParticipantsForm, moveUpToParticipantsFields] = useForm({
    // Return only submission with toast headers flickers. Therefore, the old timestamp-based workaround is used.
    id: `move-up-to-participants-${now}`,
    constraint: getZodConstraint(createMoveUpToParticipantsSchema()),
    defaultValue: {
      moveUpToParticipants: event.moveUpToParticipants,
    },
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  const location = useLocation();
  const previousLocation = usePreviousLocation();
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult: actionData === null ? undefined : actionData,
      form: moveUpToParticipantsForm,
    },
    skipRevalidation:
      location.search.includes(UnsavedChangesModalParam) ||
      (previousLocation !== null &&
        previousLocation.search.includes(UnsavedChangesModalParam)),
  });

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.limit.headline}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.limit.subline}
        </TitleSection.Subline>
      </TitleSection>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.waitingList.headline}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.waitingList.subline}
        </TitleSection.Subline>
      </TitleSection>
      <Form {...getFormProps(moveUpToParticipantsForm)} method="post">
        <div className="flex gap-2 items-center">
          <Checkbox
            {...getInputProps(moveUpToParticipantsFields.moveUpToParticipants, {
              type: "checkbox",
            })}
            onClick={(event) => {
              event.preventDefault();
              void submit(event.currentTarget.form, {
                preventScrollReset: true,
                replace: true,
              });
            }}
          />
          <label
            htmlFor={moveUpToParticipantsFields.moveUpToParticipants.id}
            className="font-semibold"
          >
            {locales.route.waitingList.form.moveUpToParticipants.label}
          </label>
        </div>
        <input
          type="hidden"
          name={INTENT_FIELD_NAME}
          value={UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT}
        />
        <noscript>
          <div className="mt-2">
            <Button variant="outline">
              {locales.route.waitingList.form.submit}
            </Button>
          </div>
        </noscript>
      </Form>
      <Hint>
        <Hint.InfoIcon />
        {locales.route.waitingList.form.hint}
      </Hint>
    </>
  );
}

export default RegistrationLimit;
