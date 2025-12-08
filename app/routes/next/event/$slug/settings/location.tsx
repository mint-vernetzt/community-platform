import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
  redirect,
  useNavigation,
} from "react-router";
import { TextArea } from "~/components-next/TextArea";
import BasicStructure from "~/components/next/BasicStructure";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import {
  createEventLocationSchema,
  getDefault,
  isSame,
  Stages,
} from "./location.shared";
import { useHydrated } from "remix-utils/use-hydrated";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { prismaClient } from "~/prisma.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import { sanitizeUserHtml } from "~/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/location"];

  const event = await prismaClient.event.findFirst({
    where: {
      slug: slug,
    },
    select: {
      venueName: true,
      venueStreet: true,
      venueCity: true,
      venueZipCode: true,
      conferenceLink: true,
      conferenceCode: true,
      accessibilityInformation: true,
      accessibilityInformationRTEState: true,
      privacyInformation: true,
      privacyInformationRTEState: true,
      stage: { select: { slug: true } },
    },
  });

  invariantResponse(event, locales.route.errors.notFound, { status: 404 });

  let stage = null;
  if (event.stage !== null) {
    stage = event.stage.slug;
  }

  return { locales, event: { ...event, stage }, currentTimeStamp: Date.now() };
};

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_create",
  ]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/location"];

  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();

  const schema = createEventLocationSchema(locales.route.validation);
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return { submission: submission.reply(), currentTimeStamp: Date.now() };
  }

  try {
    const { stage: stageValue, ...data } = submission.value;

    await prismaClient.$transaction(async (client) => {
      const stage = await client.stage.findFirst({
        where: {
          slug: stageValue,
        },
      });

      if (stage === null) {
        throw new Error("Stage not found");
      }

      const event = await client.event.update({
        where: {
          slug: slug,
        },
        data: {
          ...data,
          accessibilityInformation: sanitizeUserHtml(
            data.accessibilityInformation
          ),
          privacyInformation: sanitizeUserHtml(data.privacyInformation),
          stageId: stage.id,
        },
      });

      return event;
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "event-location-save-failed",
      key: `event-location-save-failed-${Date.now()}`,
      message: locales.route.errors.saveFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "event-location-saved",
    key: `event-location-saved-${Date.now()}`,
    message: locales.route.success,
    level: "positive",
  });
}

export default function Location() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const actionData = useActionData<typeof action>();

  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();

  const [searchParams] = useSearchParams();

  const [stage, setStage] = useState<
    (typeof Stages)[keyof typeof Stages] | null
  >(loaderData.event.stage as (typeof Stages)[keyof typeof Stages] | null);

  useEffect(() => {
    const stageParam = searchParams.get("stage");
    if (stageParam === null) {
      return;
    }

    const validStage = (Object.values(Stages) as string[]).includes(stageParam);
    if (validStage) {
      setStage(stageParam as (typeof Stages)[keyof typeof Stages]);
    }
  }, [searchParams]);

  const formTimeStamp =
    typeof actionData !== "undefined"
      ? actionData.currentTimeStamp
      : loaderData.currentTimeStamp;

  const [form, fields] = useForm({
    id: `event-location-form-${formTimeStamp}`,
    constraint: getZodConstraint(
      createEventLocationSchema(locales.route.validation)
    ),
    defaultValue: {
      venueName: getDefault(loaderData.event.venueName),
      venueStreet: getDefault(loaderData.event.venueStreet),
      venueZipCode: getDefault(loaderData.event.venueZipCode),
      venueCity: getDefault(loaderData.event.venueCity),
      conferenceLink: getDefault(loaderData.event.conferenceLink),
      conferenceCode: getDefault(loaderData.event.conferenceCode),
      accessibilityInformation: getDefault(
        loaderData.event.accessibilityInformationRTEState
      ),
      accessibilityInformationRTEState: getDefault(
        loaderData.event.accessibilityInformationRTEState
      ),
      privacyInformation: getDefault(
        loaderData.event.privacyInformationRTEState
      ),
      privacyInformationRTEState: getDefault(
        loaderData.event.privacyInformationRTEState
      ),
    },
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createEventLocationSchema(locales.route.validation),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult:
      navigation.state === "idle" && typeof actionData !== "undefined"
        ? actionData.submission
        : null,
    shouldDirtyConsider: (name) => {
      return name !== "stage";
    },
  });

  const isDirty =
    isSame(fields.stage.value, loaderData.event.stage) === false ||
    isSame(fields.venueName.value, loaderData.event.venueName) === false ||
    isSame(fields.venueStreet.value, loaderData.event.venueStreet) === false ||
    isSame(fields.venueZipCode.value, loaderData.event.venueZipCode) ===
      false ||
    isSame(fields.venueCity.value, loaderData.event.venueCity) === false ||
    isSame(fields.conferenceLink.value, loaderData.event.conferenceLink) ===
      false ||
    isSame(fields.conferenceCode.value, loaderData.event.conferenceCode) ===
      false ||
    isSame(
      fields.accessibilityInformation.value,
      loaderData.event.accessibilityInformation
    ) === false ||
    isSame(
      fields.privacyInformation.value,
      loaderData.event.privacyInformation
    ) === false;
  return (
    <div className="p-4 lg:p-6">
      <BasicStructure.Container
        deflatedUntil="lg"
        gaps={{ base: "gap-4", md: "gap-4", xl: "gap-6" }}
      >
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.stageSelection.headline}
          </TitleSection.Headline>
        </TitleSection>
        <div className="w-full flex flex-col gap-4">
          <RadioButtonSettings
            to={`?${extendSearchParams(searchParams, {
              addOrReplace: { stage: Stages.OnSite },
            }).toString()}`}
            active={stage === Stages.OnSite}
            onClick={(event) => {
              event.preventDefault();
              setStage(Stages.OnSite);
            }}
          >
            {locales.stages["on-site"].title}
          </RadioButtonSettings>
          <RadioButtonSettings
            to={`?${extendSearchParams(searchParams, {
              addOrReplace: { stage: Stages.Online },
            }).toString()}`}
            active={stage === Stages.Online}
            onClick={(event) => {
              event.preventDefault();
              setStage(Stages.Online);
            }}
          >
            {locales.stages.online.title}
          </RadioButtonSettings>
          <RadioButtonSettings
            to={`?${extendSearchParams(searchParams, {
              addOrReplace: { stage: Stages.Hybrid },
            }).toString()}`}
            active={stage === Stages.Hybrid}
            onClick={(event) => {
              event.preventDefault();
              setStage(Stages.Hybrid);
            }}
          >
            {locales.stages.hybrid.title}
          </RadioButtonSettings>
        </div>
        {stage !== null && (
          <Form
            {...getFormProps(form)}
            method="post"
            className="flex flex-col gap-4 mt-4"
            preventScrollReset
            autoComplete="off"
          >
            <Input
              {...getInputProps(fields.stage, { type: "hidden" })}
              value={stage}
            />
            {(stage === Stages.OnSite || stage === Stages.Hybrid) && (
              <>
                <Input
                  label={locales.route.venueName}
                  {...getInputProps(fields.venueName, { type: "text" })}
                  key="venueName"
                >
                  <Input.Label>{locales.route.venueName}</Input.Label>
                  {Array.isArray(fields.venueName.errors) &&
                    fields.venueName.errors.length > 0 &&
                    fields.venueName.errors.map((error) => (
                      <Input.Error id={fields.venueName.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))}
                </Input>
                <Input
                  label={locales.route.venueStreet}
                  {...getInputProps(fields.venueStreet, { type: "text" })}
                >
                  <Input.Label>{locales.route.venueStreet}</Input.Label>
                  {Array.isArray(fields.venueStreet.errors) &&
                    fields.venueStreet.errors.length > 0 &&
                    fields.venueStreet.errors.map((error) => (
                      <Input.Error id={fields.venueStreet.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))}
                </Input>
                <Input
                  label={locales.route.venueZipCode}
                  {...getInputProps(fields.venueZipCode, { type: "text" })}
                >
                  <Input.Label>{locales.route.venueZipCode}</Input.Label>
                  {Array.isArray(fields.venueZipCode.errors) &&
                    fields.venueZipCode.errors.length > 0 &&
                    fields.venueZipCode.errors.map((error) => (
                      <Input.Error id={fields.venueZipCode.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))}
                </Input>
                <Input
                  label={locales.route.venueCity}
                  {...getInputProps(fields.venueCity, { type: "text" })}
                >
                  <Input.Label>{locales.route.venueCity}</Input.Label>
                  {Array.isArray(fields.venueCity.errors) &&
                    fields.venueCity.errors.length > 0 &&
                    fields.venueCity.errors.map((error) => (
                      <Input.Error id={fields.venueCity.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))}
                </Input>
              </>
            )}
            {(stage === Stages.Online || stage === Stages.Hybrid) && (
              <>
                <Input
                  label={locales.route.conferenceLink}
                  {...getInputProps(fields.conferenceLink, { type: "text" })}
                >
                  <Input.Label>{locales.route.conferenceLink}</Input.Label>
                  {Array.isArray(fields.conferenceLink.errors) &&
                    fields.conferenceLink.errors.length > 0 &&
                    fields.conferenceLink.errors.map((error) => (
                      <Input.Error
                        id={fields.conferenceLink.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))}
                </Input>
                <Input
                  label={locales.route.conferenceCode}
                  {...getInputProps(fields.conferenceCode, { type: "text" })}
                >
                  <Input.Label>{locales.route.conferenceCode}</Input.Label>
                  {Array.isArray(fields.conferenceCode.errors) &&
                    fields.conferenceCode.errors.length > 0 &&
                    fields.conferenceCode.errors.map((error) => (
                      <Input.Error
                        id={fields.conferenceCode.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))}
                </Input>
              </>
            )}
            <TextArea
              {...getInputProps(fields.accessibilityInformation, {
                type: "text",
              })}
              key="accessibilityInformation"
              id={fields.accessibilityInformation.id || ""}
              label={locales.route.accessibilityInformation.label}
              errorMessage={
                Array.isArray(fields.accessibilityInformation.errors)
                  ? fields.accessibilityInformation.errors.join(", ")
                  : undefined
              }
              rte={{
                isFormDirty: isDirty,
                locales: { rte: locales.rte },
                defaultValue:
                  fields.accessibilityInformationRTEState.initialValue,
              }}
              helperText={locales.route.accessibilityInformation.helperText}
            />
            <TextArea
              {...getInputProps(fields.privacyInformation, { type: "text" })}
              key="privacyInformation"
              id={fields.privacyInformation.id || ""}
              label={locales.route.privacyInformation.label}
              errorMessage={
                Array.isArray(fields.privacyInformation.errors)
                  ? fields.privacyInformation.errors.join(", ")
                  : undefined
              }
              rte={{
                isFormDirty: isDirty,
                locales: { rte: locales.rte },
                defaultValue: fields.privacyInformationRTEState.initialValue,
              }}
              helperText={locales.route.privacyInformation.helperText}
            />
          </Form>
        )}
      </BasicStructure.Container>
      {stage !== null && (
        <div className="flex flex-col md:flex-row gap-4 md:justify-end mt-4 lg:mt-6">
          <div className="md:grow-0">
            <Button
              type="reset"
              form={form.id}
              onClick={() => {
                setTimeout(() => form.reset(), 0);
              }}
              variant="outline"
              fullSize
              // Don't disable button when js is disabled
              disabled={isHydrated ? isDirty === false : false}
            >
              {locales.route.reset}
            </Button>
            <noscript className="absolute top-0">
              <Button as="link" to="." variant="outline" fullSize>
                {locales.route.reset}
              </Button>
            </noscript>
          </div>
          <div className="md:grow-0">
            <Button
              type="submit"
              form={form.id}
              defaultValue="submit"
              fullSize
              // Don't disable button when js is disabled
              disabled={
                isHydrated
                  ? isDirty === false || form.valid === false || isSubmitting
                  : false
              }
            >
              {locales.route.submit}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
