import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
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
import { getCoordinatesFromAddress, sanitizeUserHtml } from "~/utils.server";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import {
  createEventLocationSchema,
  getStageDefaultValue,
  Stages,
} from "./location.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

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
    "next_event_settings",
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

  const event = await prismaClient.event.findUnique({
    select: {
      id: true,
      venueStreet: true,
      venueZipCode: true,
      venueCity: true,
      venueLongitude: true,
      venueLatitude: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(event !== null, locales.route.errors.notFound, {
    status: 404,
  });

  let addressError;
  try {
    const { stage: stageValue, ...data } = submission.value;

    let venueLongitude = event.venueLongitude;
    let venueLatitude = event.venueLatitude;
    if (
      data.venueStreet !== event.venueStreet ||
      data.venueCity !== event.venueCity ||
      data.venueZipCode !== event.venueZipCode
    ) {
      const result = await getCoordinatesFromAddress({
        id: event.id,
        street: data.venueStreet,
        city: data.venueCity,
        zipCode: data.venueZipCode,
      });
      if (result.error !== null) {
        console.error(result.error);
        addressError = result.error;
      }
      venueLongitude = result.longitude;
      venueLatitude = result.latitude;
    } else {
      if (
        (event.venueStreet !== null ||
          event.venueCity !== null ||
          event.venueZipCode !== null) &&
        event.venueLongitude === null &&
        event.venueLatitude === null
      ) {
        addressError = "Address not changed but coordinates still not found";
      }
    }

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
          venueLongitude,
          venueLatitude,
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

  if (typeof addressError !== "undefined") {
    return redirectWithToast(request.url, {
      key: "address-error-toast",
      level: "attention",
      message: insertParametersIntoLocale(
        locales.route.errors.coordinatesNotFound,
        {
          street: submission.value.venueStreet,
          city: submission.value.venueCity,
          zipCode: submission.value.venueZipCode,
        }
      ),
      isRichtext: true,
      delayInMillis: 60000,
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

  const [form, fields] = useForm({
    id: `event-location-form-${loaderData.currentTimeStamp}`,
    constraint: getZodConstraint(
      createEventLocationSchema(locales.route.validation)
    ),
    defaultValue: {
      ...loaderData.event,
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
        gaps={{ base: "gap-8", md: "gap-8", xl: "gap-10" }}
        rounded="rounded-lg"
      >
        <div className="w-full flex flex-col gap-4">
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
