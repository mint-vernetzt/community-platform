import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { TextArea } from "~/components-next/TextArea";
import BasicStructure from "~/components/next/BasicStructure";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { sanitizeUserHtml } from "~/utils.server";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import {
  createEventLocationSchema,
  getStageDefaultValue,
  Stages,
} from "./location.shared";

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
    return submission.reply();
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
  const stageSearchParam = searchParams.get("stage");

  const [stage, setStage] = useState<
    (typeof Stages)[keyof typeof Stages] | null
  >(
    getStageDefaultValue({
      stageSearchParam,
      stageFromDb: loaderData.event.stage,
    })
  );

  const onSiteDefaults = {
    venueName: loaderData.event.venueName,
    venueStreet: loaderData.event.venueStreet,
    venueZipCode: loaderData.event.venueZipCode,
    venueCity: loaderData.event.venueCity,
  };
  const onlineDefaults = {
    conferenceLink: loaderData.event.conferenceLink,
    conferenceCode: loaderData.event.conferenceCode,
  };
  const generalDefaults = {
    stage: loaderData.event.stage,
    accessibilityInformation: loaderData.event.accessibilityInformation,
    accessibilityInformationRTEState:
      loaderData.event.accessibilityInformationRTEState,
    privacyInformation: loaderData.event.privacyInformation,
    privacyInformationRTEState: loaderData.event.privacyInformationRTEState,
  };

  const [form, fields] = useForm({
    id: `event-location-form-${loaderData.currentTimeStamp}`,
    constraint: getZodConstraint(
      createEventLocationSchema(locales.route.validation)
    ),
    defaultValue:
      stage === null
        ? {
            ...generalDefaults,
          }
        : stage === Stages.OnSite
          ? {
              ...onSiteDefaults,
              ...generalDefaults,
            }
          : stage === Stages.Online
            ? {
                ...onlineDefaults,
                ...generalDefaults,
              }
            : {
                ...onSiteDefaults,
                ...onlineDefaults,
                ...generalDefaults,
              },
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createEventLocationSchema(locales.route.validation),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

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
              defaultValue={undefined}
              value={stage}
            />
            <div hidden={stage !== Stages.OnSite && stage !== Stages.Hybrid}>
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
            </div>
            <div hidden={stage !== Stages.OnSite && stage !== Stages.Hybrid}>
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
            </div>
            <div hidden={stage !== Stages.OnSite && stage !== Stages.Hybrid}>
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
            </div>
            <div hidden={stage !== Stages.OnSite && stage !== Stages.Hybrid}>
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
            </div>
            <div hidden={stage !== Stages.Online && stage !== Stages.Hybrid}>
              <Input
                label={locales.route.conferenceLink}
                {...getInputProps(fields.conferenceLink, { type: "text" })}
              >
                <Input.Label>{locales.route.conferenceLink}</Input.Label>
                {Array.isArray(fields.conferenceLink.errors) &&
                  fields.conferenceLink.errors.length > 0 &&
                  fields.conferenceLink.errors.map((error) => (
                    <Input.Error id={fields.conferenceLink.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))}
              </Input>
            </div>
            <div hidden={stage !== Stages.Online && stage !== Stages.Hybrid}>
              <Input
                label={locales.route.conferenceCode}
                {...getInputProps(fields.conferenceCode, { type: "text" })}
              >
                <Input.Label>{locales.route.conferenceCode}</Input.Label>
                {Array.isArray(fields.conferenceCode.errors) &&
                  fields.conferenceCode.errors.length > 0 &&
                  fields.conferenceCode.errors.map((error) => (
                    <Input.Error id={fields.conferenceCode.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))}
              </Input>
            </div>
            <TextArea
              {...getInputProps(fields.accessibilityInformation, {
                type: "text",
              })}
              key="accessibilityInformation"
              id={fields.accessibilityInformation.id || ""}
              label={locales.route.accessibilityInformation.label}
              helperText={locales.route.accessibilityInformation.helperText}
              errorMessage={
                Array.isArray(fields.accessibilityInformation.errors)
                  ? fields.accessibilityInformation.errors.join(", ")
                  : undefined
              }
              errorId={fields.accessibilityInformation.errorId}
              rte={{
                isFormDirty: form.dirty,
                locales: { rte: locales.rte },
                defaultValue:
                  fields.accessibilityInformationRTEState.defaultValue,
              }}
            />
            <TextArea
              {...getInputProps(fields.privacyInformation, { type: "text" })}
              key="privacyInformation"
              id={fields.privacyInformation.id || ""}
              label={locales.route.privacyInformation.label}
              helperText={locales.route.privacyInformation.helperText}
              errorMessage={
                Array.isArray(fields.privacyInformation.errors)
                  ? fields.privacyInformation.errors.join(", ")
                  : undefined
              }
              errorId={fields.privacyInformation.errorId}
              rte={{
                isFormDirty: form.dirty,
                locales: { rte: locales.rte },
                defaultValue: fields.privacyInformationRTEState.initialValue,
              }}
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
                setStage(
                  loaderData.event.stage as
                    | (typeof Stages)[keyof typeof Stages]
                    | null
                );
                setTimeout(() => form.reset(), 0);
              }}
              variant="outline"
              fullSize
              // Don't disable button when js is disabled
              disabled={isHydrated ? form.dirty === false : false}
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
                  ? form.dirty === false || form.valid === false || isSubmitting
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
