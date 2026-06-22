import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { useState } from "react";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import eventDefaultBackgroundBlurred from "~/assets/default-event-background-blurred.jpg";
import eventDefaultBackground from "~/assets/default-event-background.jpg";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { UploadIcon } from "~/components-next/icons/UploadIcon";
import TitleSection from "~/components/next/TitleSection";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { ImageAspectsAsStrings, MaxImageSizes } from "~/images.shared";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { parseMultipartFormData } from "~/storage.server";
import {
  FILE_FIELD_NAME,
  IMAGE_CREDITS_FIELD_NAME,
  IMAGE_CREDITS_MAX_LENGTH,
  IMAGE_DESCRIPTION_FIELD_NAME,
  IMAGE_DESCRIPTION_MAX_LENGTH,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE,
  nextGetUploadImageSchema,
  REMOVE_IMAGE_INTENT_VALUE,
  UPLOAD_IMAGE_INTENT_VALUE,
} from "~/storage.shared";
import { createToastHeaders, redirectWithToast } from "~/toast.server";
import {
  getEventBySlugForIssues,
  getIssues,
  getRedirectPathOnProtectedEventRoute,
} from "../../settings.server";
import {
  changeEventBackground,
  getEventBySlugWithBackground,
  removeEventBackground,
} from "./background.server";
import ShadowOrganizationHint from "~/components/next/ShadowOrganizationHint";
import { TextArea } from "~/components-next/TextArea";
import ImageCropper, {
  croppedAreaToBlob,
} from "~/components/next/ImageCropper";
import { type Area } from "react-easy-crop";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import reactEasyCropStyles from "react-easy-crop/react-easy-crop.css?url";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { UnsavedChangesModalParam } from "~/lib/utils/searchParams";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactEasyCropStyles },
  ];
}

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/details/background"];

  const event = await getEventBySlugWithBackground(slug, authClient);
  invariantResponse(event, "Event not found", { status: 404 });

  let issues: ReturnType<typeof getIssues> = [];
  if (event.publishIntended) {
    const eventForIssues = await getEventBySlugForIssues(slug);
    issues = getIssues({
      event: eventForIssues,
      locales: languageModuleMap[language]["event/$slug/settings"].route,
      section: "details",
    });
  }

  return { locales, background: event.background, issues };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);
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
    languageModuleMap[language]["event/$slug/settings/details/background"];

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "upload-image-error",
      key: `${new Date().getTime()}`,
      message: locales.route.errors.uploadImageFailed,
      level: "negative",
    });
  }

  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === UPLOAD_IMAGE_INTENT_VALUE ||
      intent === REMOVE_IMAGE_INTENT_VALUE,
    "unknown intent",
    {
      status: 400,
    }
  );

  if (intent === UPLOAD_IMAGE_INTENT_VALUE) {
    const submission = parseWithZod(formData, {
      schema: nextGetUploadImageSchema(locales.route.validation),
    });

    if (submission.status !== "success") {
      return {
        submission: submission.reply(),
        intent: UPLOAD_IMAGE_INTENT_VALUE,
      };
    }

    try {
      await changeEventBackground({
        slug,
        authClient,
        data: submission.value,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "upload-image-error",
        key: `upload-image-error-${Date.now()}`,
        message: locales.route.errors.uploadImageFailed,
        level: "negative",
      });
    }

    const toastHeaders = await createToastHeaders({
      id: "upload-image-success",
      key: `upload-image-success-${Date.now()}`,
      message: locales.route.success.imageAdded,
      level: "positive",
    });
    return data(
      { submission: submission.reply(), intent },
      {
        headers: toastHeaders,
      }
    );
  } else {
    try {
      await removeEventBackground({
        slug,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "remove-image-error",
        key: `remove-image-error-${Date.now()}`,
        message: locales.route.errors.removeImageFailed,
        level: "negative",
      });
    }

    const toastHeaders = await createToastHeaders({
      id: "remove-image-success",
      key: `remove-image-success-${Date.now()}`,
      message: locales.route.success.imageRemoved,
      level: "positive",
    });
    return data(
      { submission: undefined, intent },
      {
        headers: toastHeaders,
      }
    );
  }
}

function Background() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, background, issues } = loaderData;
  const actionData = useActionData<typeof action>();
  const { submission } = actionData ?? {};

  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const isSubmitting = useIsSubmitting();
  const submit = useSubmit();

  const [selectedFiles, setSelectedFiles] = useState<
    {
      filename: string;
      sizeInMB: number;
      src: string;
    }[]
  >([]);

  const [description, setDescription] = useState(
    background !== null ? background.description : null
  );
  const [credits, setCredits] = useState(
    background !== null ? background.credits : null
  );

  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [freezeCrop, setFreezeCrop] = useState(false);

  const defaultValue = {
    [FILE_FIELD_NAME]: undefined,
    [IMAGE_DESCRIPTION_FIELD_NAME]:
      background !== null ? background.description : null,
    [IMAGE_CREDITS_FIELD_NAME]: background !== null ? background.credits : null,
    [INTENT_FIELD_NAME]: UPLOAD_IMAGE_INTENT_VALUE,
  };

  const [uploadForm, uploadFields] = useForm({
    id: "upload-image-form",
    constraint: getZodConstraint(
      nextGetUploadImageSchema(locales.route.validation)
    ),
    defaultValue,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? submission : undefined,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: nextGetUploadImageSchema(locales.route.validation),
      });
      return submission;
    },
    onSubmit: async (event, { formData }) => {
      if (croppedArea !== null && selectedFiles.length > 0) {
        event.preventDefault();
        const croppedImageFile = await croppedAreaToBlob({
          croppedArea,
          sourceImage: {
            src: selectedFiles[0].src,
            filename: selectedFiles[0].filename,
          },
        });
        formData.set(FILE_FIELD_NAME, croppedImageFile);
        void submit(formData, {
          method: "post",
          encType: "multipart/form-data",
        });
      }
    },
  });

  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult: submission,
      form: uploadForm,
    },
    extendedFunctionality: () => {
      setSelectedFiles([]);
    },
  });

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={uploadForm}
        locales={locales.components.UnsavedChangesModal}
      />
      <TitleSection>
        <TitleSection.Headline>
          <span className="flex items-center gap-2.5">
            {locales.route.title}
            {issues.some((issue) => {
              return issue.fields.includes("title");
            }) && <span className="rounded-full w-2 h-2 bg-primary-300" />}
          </span>
        </TitleSection.Headline>
        <TitleSection.Subline>
          {insertParametersIntoLocale(locales.route.fileExplanation, {
            size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
          })}
        </TitleSection.Subline>
        <TitleSection.Subline>
          {insertParametersIntoLocale(locales.route.aspectExplanation, {
            aspectRatio: ImageAspectsAsStrings.EventBackground,
            minWidth: MaxImageSizes.EventBackground.width,
          })}
        </TitleSection.Subline>
      </TitleSection>
      {background !== null && selectedFiles.length === 0 ? (
        <Form id="remove-image-form" hidden method="POST" />
      ) : null}

      {isHydrated && selectedFiles.length > 0 ? (
        <ImageCropper
          src={selectedFiles[0].src}
          aspect={3 / 2}
          setCroppedArea={setCroppedArea}
          freezed={freezeCrop}
        />
      ) : (
        <div className="relative w-full aspect-3/2 rounded-md overflow-hidden">
          <Image
            alt={locales.route.currentBackground.title}
            src={
              selectedFiles.length > 0
                ? selectedFiles[0].src
                : background !== null
                  ? background.path
                  : eventDefaultBackground
            }
            blurredSrc={
              selectedFiles.length > 0
                ? selectedFiles[0].src
                : background !== null
                  ? background.blurredPath
                  : eventDefaultBackgroundBlurred
            }
          >
            {background !== null && selectedFiles.length === 0 ? (
              <Image.RemoveButton
                label={locales.route.currentBackground.remove}
                buttonProps={{
                  type: "submit",
                  form: "remove-image-form",
                  name: INTENT_FIELD_NAME,
                  value: REMOVE_IMAGE_INTENT_VALUE,
                }}
              />
            ) : null}
          </Image>
        </div>
      )}

      <div className="w-full flex flex-col gap-2 md:justify-start md:flex-row-reverse">
        <div className="w-full flex flex-col-reverse md:flex-row-reverse gap-2">
          <div className="w-full md:w-fit">
            <Button
              as="label"
              htmlFor={uploadFields[FILE_FIELD_NAME].id}
              fullSize
              variant="outline"
              tabIndex={0}
              onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) =>
                event.key === "Enter" && event.currentTarget.click()
              }
            >
              <UploadIcon />
              <span>{locales.route.changeBackground.pick}</span>
            </Button>
          </div>
          {isHydrated && selectedFiles.length > 0 ? (
            <div className="w-full md:w-fit">
              {freezeCrop === false ? (
                <Button
                  fullSize
                  onClick={() => {
                    setFreezeCrop(true);
                  }}
                >
                  {locales.route.changeBackground.crop.confirm}
                </Button>
              ) : (
                <Button
                  fullSize
                  variant="outline"
                  onClick={() => {
                    setFreezeCrop(false);
                  }}
                >
                  {locales.route.changeBackground.crop.edit}
                </Button>
              )}
            </div>
          ) : null}
        </div>
        <Form
          {...getFormProps(uploadForm)}
          method="POST"
          encType="multipart/form-data"
          hidden={isHydrated}
        >
          <input
            {...getInputProps(uploadFields[INTENT_FIELD_NAME], {
              type: "hidden",
            })}
          />
          <input
            {...getInputProps(uploadFields[FILE_FIELD_NAME], {
              type: "file",
            })}
            className="cursor-pointer"
            accept={IMAGE_MIME_TYPES.join(", ")}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedFiles([]);
              if (event.target.files !== null) {
                Array.from(event.target.files).map((file) => {
                  const reader = new FileReader();
                  reader.addEventListener("load", () => {
                    setSelectedFiles((prevSelectedFiles) => {
                      if (
                        reader.result !== null &&
                        typeof reader.result === "string"
                      ) {
                        return [
                          ...prevSelectedFiles,
                          {
                            filename: file.name,
                            sizeInMB: file.size / 1000 / 1000,
                            src: reader.result,
                          },
                        ];
                      }
                      return prevSelectedFiles;
                    });
                    if (
                      reader.result !== null &&
                      typeof reader.result === "string"
                    ) {
                      setDescription(null);
                      setCredits(null);
                      setFreezeCrop(false);
                    }
                  });
                  reader.readAsDataURL(file);
                });
              }
              uploadForm.validate();
            }}
          />
        </Form>
        {typeof uploadFields.file.errors !== "undefined" &&
        uploadFields.file.errors.length > 0
          ? uploadFields.file.errors.map((error) => (
              <Input.Error id={uploadFields.file.errorId} key={error}>
                {error}
              </Input.Error>
            ))
          : null}
      </div>
      {isHydrated === false ||
      background !== null ||
      selectedFiles.length > 0 ? (
        <>
          <TextArea
            {...getInputProps(uploadFields.description, { type: "text" })}
            defaultValue={undefined}
            value={description ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setDescription(event.target.value);
            }}
            maxLength={IMAGE_DESCRIPTION_MAX_LENGTH}
            label={locales.route.changeBackground.description.label}
            placeholder={locales.route.changeBackground.description.placeholder}
            helperText={locales.route.changeBackground.description.helperText}
            errorMessage={
              typeof uploadFields.description.errors !== "undefined" &&
              uploadFields.description.errors.length > 0
                ? uploadFields.description.errors.join(", ")
                : undefined
            }
            errorId={uploadFields.description.errorId}
            height="h-[79px]"
          />
          <TextArea
            {...getInputProps(uploadFields.credits, { type: "text" })}
            defaultValue={undefined}
            value={credits ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setCredits(event.target.value);
            }}
            maxLength={IMAGE_CREDITS_MAX_LENGTH}
            label={locales.route.changeBackground.credits.label}
            placeholder={locales.route.changeBackground.credits.placeholder}
            helperText={locales.route.changeBackground.credits.helperText}
            errorMessage={
              typeof uploadFields.credits.errors !== "undefined" &&
              uploadFields.credits.errors.length > 0
                ? uploadFields.credits.errors.join(", ")
                : undefined
            }
            errorId={uploadFields.credits.errorId}
            height="h-[79px]"
          />
          <div className="w-full flex md:justify-end">
            <div className="w-full md:w-fit flex flex-col md:flex-row-reverse gap-4">
              <div className="w-full md:w-fit">
                <Button
                  type="submit"
                  fullSize
                  form={uploadForm.id}
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? uploadForm.dirty === false ||
                        uploadForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.route.changeBackground.submit}
                </Button>
              </div>
              <div className="w-full md:w-fit">
                <div className="relative w-full">
                  <Button
                    type="reset"
                    onClick={() => {
                      setSelectedFiles([]);
                      setDescription(
                        background !== null ? background.description : null
                      );
                      setCredits(
                        background !== null ? background.credits : null
                      );
                      setFreezeCrop(false);
                      uploadForm.reset();
                    }}
                    variant="outline"
                    fullSize
                    // Don't disable button when js is disabled
                    disabled={isHydrated ? uploadForm.dirty === false : false}
                  >
                    {locales.route.changeBackground.discard}
                  </Button>
                  <noscript className="absolute top-0">
                    <Button as="link" to="." variant="outline" fullSize>
                      {locales.route.changeBackground.discard}
                    </Button>
                  </noscript>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ShadowOrganizationHint>
          <ShadowOrganizationHint.Description>
            {locales.route.toMediaDatabase.hint}
          </ShadowOrganizationHint.Description>
          <ShadowOrganizationHint.Controls>
            <div className="w-full @md:w-fit">
              <Button
                as="link"
                to="https://mediendatenbank.mint-vernetzt.de/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="small"
                fullSize
              >
                {locales.route.toMediaDatabase.cta}
              </Button>
            </div>
          </ShadowOrganizationHint.Controls>
        </ShadowOrganizationHint>
      )}
    </>
  );
}

export default Background;
