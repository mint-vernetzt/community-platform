import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { Checkbox } from "~/components-next/Checkbox";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import TitleSection from "~/components/next/TitleSection";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import {
  Deep,
  extendSearchParams,
  UnsavedChangesModalParam,
} from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { createToastHeaders, redirectWithToast } from "~/toast.server";
import {
  getEventBySlug,
  getEventIdBySlug,
  updateEventById,
} from "./limit.server";
import {
  createMoveUpToParticipantsSchema,
  createParticipantLimitSchema,
  LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM,
  UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT,
  UPDATE_PARTICIPANT_LIMIT_INTENT,
} from "./limit.shared";

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

  if (event.external || event.openForRegistration === false) {
    return redirect(
      `/next/event/${slug}/settings/registration/access?${Deep}=true`,
      {
        status: 302,
      }
    );
  }

  return { locales, event };
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
    intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT ||
      intent === UPDATE_PARTICIPANT_LIMIT_INTENT,
    "Invalid intent",
    {
      status: 400,
    }
  );

  if (intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT) {
    const schema = createMoveUpToParticipantsSchema();
    const submission = await parseWithZod(formData, { schema });

    if (submission.status !== "success") {
      return { intent, submission: submission.reply() };
    }

    try {
      await updateEventById(eventId, {
        moveUpToParticipants: submission.value.moveUpToParticipants,
      });
      const toastHeaders = await createToastHeaders({
        id: "update-participant-limit-success",
        key: `update-participant-limit-success-${Date.now()}`,
        message: locales.route.success.participantLimit,
        level: "positive",
      });
      return data(
        { intent, submission: submission.reply() },
        {
          headers: toastHeaders,
        }
      );
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
  const schema = createParticipantLimitSchema();
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return { intent, submission: submission.reply() };
  }

  try {
    await updateEventById(eventId, {
      participantLimit: submission.value.participantLimit,
    });
    const toastHeaders = await createToastHeaders({
      id: "update-participant-limit-success",
      key: `update-participant-limit-success-${Date.now()}`,
      message: locales.route.success.participantLimit,
      level: "positive",
    });
    return data(
      { intent, submission: submission.reply() },
      {
        headers: toastHeaders,
      }
    );
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "update-participant-limit-error",
      key: `update-participant-limit-error-${Date.now()}`,
      message: locales.route.errors.participantLimit,
      level: "negative",
    });
  }
}

function RegistrationLimit() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const { locales } = loaderData;

  const submit = useSubmit();
  const navigation = useNavigation();
  const location = useLocation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [searchParams] = useSearchParams();

  let intent;
  let submission;
  if (typeof actionData !== "undefined" && actionData !== null) {
    intent = actionData.intent;
    submission = actionData.submission;
  }

  const [moveUpToParticipantsForm, moveUpToParticipantsFields] = useForm({
    id: "move-up-to-participants",
    constraint: getZodConstraint(createMoveUpToParticipantsSchema()),
    defaultValue: {
      moveUpToParticipants: loaderData.event.moveUpToParticipants,
    },
    onValidate: (args) => {
      const submission = parseWithZod(args.formData, {
        schema: createMoveUpToParticipantsSchema(),
      });
      return submission;
    },
    lastResult:
      navigation.state === "idle" &&
      intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT
        ? submission
        : undefined,
  });

  const [participantLimitForm, participantLimitFields] = useForm({
    id: "participant-limit",
    constraint: getZodConstraint(createParticipantLimitSchema()),
    defaultValue: {
      participantLimit: loaderData.event.participantLimit,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createParticipantLimitSchema(),
      });
      return submission;
    },
    onSubmit: async (event, context) => {
      const submission = parseWithZod(context.formData, {
        schema: createParticipantLimitSchema(),
      });
      if (
        submission.status === "success" &&
        submission.value.participantLimit !== null &&
        submission.value.participantLimit < loaderData.event._count.participants
      ) {
        if (
          searchParams.get(LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM) !==
          "true"
        ) {
          event.preventDefault();
          const url = `${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM]: "true" } })}`;
          void submit(url, {
            preventScrollReset: true,
            replace: true,
          });
        } else {
          event.preventDefault();
          const action = `?${extendSearchParams(searchParams, { remove: [LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM] })}`;
          void submit(context.formData, {
            ...context,
            action,
            preventScrollReset: true,
            replace: true,
          });
        }
      }
    },
    shouldDirtyConsider: (name) => {
      return name === "participantLimit";
    },
    lastResult:
      navigation.state === "idle" && intent === UPDATE_PARTICIPANT_LIMIT_INTENT
        ? submission
        : undefined,
  });

  const previousLocation = usePreviousLocation();
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult:
        intent === UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT
          ? submission
          : undefined,
      form: moveUpToParticipantsForm,
    },
  });
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult:
        intent === UPDATE_PARTICIPANT_LIMIT_INTENT ? submission : undefined,
      form: participantLimitForm,
    },
    skipRevalidation:
      location.search.includes(UnsavedChangesModalParam) ||
      (previousLocation !== null &&
        previousLocation.search.includes(UnsavedChangesModalParam)),
  });

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={participantLimitForm}
        locales={locales.components.UnsavedChangesModal}
      />
      <div className="flex flex-col gap-8 p-4">
        <div className="flex flex-col gap-4">
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.limit.headline}
            </TitleSection.Headline>
            <TitleSection.Subline>
              {locales.route.limit.subline}
            </TitleSection.Subline>
          </TitleSection>
          <Form {...getFormProps(participantLimitForm)} method="post">
            <input
              type="hidden"
              name={INTENT_FIELD_NAME}
              value={UPDATE_PARTICIPANT_LIMIT_INTENT}
            />
            <Input
              {...getInputProps(participantLimitFields.participantLimit, {
                type: "number",
              })}
              placeholder={
                locales.route.limit.form.participantLimit.placeholder
              }
            >
              <Input.Label>
                {locales.route.limit.form.participantLimit.label}
              </Input.Label>
              <Input.HelperText>
                {locales.route.limit.form.participantLimit.helper}
              </Input.HelperText>
            </Input>
          </Form>
          <Modal searchParam={LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM}>
            <Modal.Title>{locales.route.limit.form.modal.title}</Modal.Title>
            <Modal.Section>
              <p>
                {insertComponentsIntoLocale(
                  insertParametersIntoLocale(
                    locales.route.limit.form.modal.description,
                    {
                      participantLimit:
                        participantLimitFields.participantLimit.value,
                      participantsCount: loaderData.event._count.participants,
                    }
                  ),
                  [<span key="highlight" className="font-semibold" />]
                )}
              </p>
            </Modal.Section>
            <Modal.SubmitButton form={participantLimitForm.id} level="negative">
              {locales.route.limit.form.modal.submit}
            </Modal.SubmitButton>
            <Modal.CloseButton route={location.pathname}>
              {locales.route.limit.form.modal.cancel}
            </Modal.CloseButton>
          </Modal>
          <div className="w-full flex flex-col md:flex-row-reverse gap-4 md:justify-start">
            <div className="w-full md:w-fit">
              <Button
                type="submit"
                fullSize
                form={participantLimitForm.id}
                // Don't disable button when js is disabled
                disabled={
                  isHydrated
                    ? participantLimitForm.dirty === false ||
                      participantLimitForm.valid === false ||
                      isSubmitting
                    : false
                }
              >
                {locales.route.limit.form.submit}
              </Button>
            </div>
            <div className="w-full md:w-fit">
              <Button
                type="reset"
                onClick={() => {
                  participantLimitForm.reset();
                }}
                variant="outline"
                fullSize
                form={participantLimitForm.id}
                // Don't disable button when js is disabled
                disabled={
                  isHydrated ? participantLimitForm.dirty === false : false
                }
              >
                {locales.route.limit.form.reset}
              </Button>
              <noscript className="absolute top-0">
                <Button as="link" to="." variant="outline" fullSize>
                  {locales.route.limit.form.reset}
                </Button>
              </noscript>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
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
                {...getInputProps(
                  moveUpToParticipantsFields.moveUpToParticipants,
                  {
                    type: "checkbox",
                  }
                )}
                onChange={(event) => {
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
              defaultValue={UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT}
            />
            <noscript>
              <div className="mt-2">
                <Button variant="outline" type="submit">
                  {locales.route.waitingList.form.submit}
                </Button>
              </div>
            </noscript>
          </Form>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.waitingList.form.hint}
          </Hint>
        </div>
      </div>
    </>
  );
}

export default RegistrationLimit;
