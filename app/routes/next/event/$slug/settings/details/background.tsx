import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import {
  type ActionFunctionArgs,
  Form,
  useLoaderData,
  useNavigation,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
} from "react-router";
import { ImageAspectsAsStrings, MaxImageSizes } from "~/images.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import {
  FILE_FIELD_NAME,
  IMAGE_CREDITS_FIELD_NAME,
  IMAGE_CREDITS_MAX_LENGTH,
  IMAGE_DESCRIPTION_FIELD_NAME,
  IMAGE_DESCRIPTION_MAX_LENGTH,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE,
  nextGetUploadImageSchema,
  UPLOAD_IMAGE_INTENT_VALUE,
} from "~/storage.shared";
import eventDefaultBackground from "~/assets/default-event-background.jpg";
import eventDefaultBackgroundBlurred from "~/assets/default-event-background-blurred.jpg";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useHydrated } from "remix-utils/use-hydrated";
import { useState } from "react";
import { UploadIcon } from "~/components-next/icons/UploadIcon";
import TitleSection from "~/components/next/TitleSection";
import { changeEventBackground, getEventBackground } from "./background.server";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { parseMultipartFormData } from "~/storage.server";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

// TODO: Background editing on detail should be a link leading here

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details/background"];

  const { authClient } = createAuthClient(request);
  const background = await getEventBackground(params.slug, authClient);

  return { locales, background };
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
    languageModuleMap[language]["next/event/$slug/settings/details/background"];

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
  invariantResponse(intent === UPLOAD_IMAGE_INTENT_VALUE, "unknown intent", {
    status: 400,
  });

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
      slug: params.slug,
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

  return redirectWithToast(request.url, {
    id: "upload-image-success",
    key: `upload-image-success-${Date.now()}`,
    message: locales.route.success.imageAdded,
    level: "positive",
  });
}

// TODO: no js functionality

function Background() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, background } = loaderData;
  const actionData = useActionData<typeof action>();
  const { submission } = actionData ?? {};

  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const isSubmitting = useIsSubmitting();

  const [selectedFiles, setSelectedFiles] = useState<
    {
      filename: string;
      sizeInMB: number;
      src: string;
    }[]
  >([]);

  // TODO: dirty state not working yet
  console.log("background", background);

  const [uploadForm, uploadFields] = useForm({
    id: "upload-image-form",
    constraint: getZodConstraint(
      nextGetUploadImageSchema(locales.route.validation)
    ),
    defaultValue: {
      [FILE_FIELD_NAME]: null,
      [IMAGE_DESCRIPTION_FIELD_NAME]:
        background !== null ? background.description : null,
      [IMAGE_CREDITS_FIELD_NAME]:
        background !== null ? background.credits : null,
    },
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
    onSubmit: () => {
      setSelectedFiles([]);
    },
  });

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>{locales.route.title}</TitleSection.Headline>
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
      {/* TODO: Crop functionality on selected file */}
      {/* TODO: If current background exists add the remove button */}
      <div className="w-full aspect-3/2 rounded-md overflow-hidden">
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
        />
      </div>
      <Form
        {...getFormProps(uploadForm)}
        method="POST"
        encType="multipart/form-data"
        hidden={isHydrated}
      >
        <input
          name={INTENT_FIELD_NAME}
          type="hidden"
          value={UPLOAD_IMAGE_INTENT_VALUE}
        />
        <input
          {...getInputProps(uploadFields[FILE_FIELD_NAME], {
            type: "file",
          })}
          type="file"
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
                });
                reader.readAsDataURL(file);
              });
            }
            uploadForm.validate();
          }}
        />
      </Form>
      {/* TODO: Display this on correct location after its discussed with design team */}
      {typeof uploadFields.file.errors !== "undefined" &&
      uploadFields.file.errors.length > 0 ? (
        uploadFields.file.errors.map((error) => (
          <Input.Error id={uploadFields.file.errorId} key={error}>
            {error}
          </Input.Error>
        ))
      ) : (
        <Input.HelperText>
          {locales.route.changeBackground.description.helperText}
        </Input.HelperText>
      )}
      <div className="flex md:justify-end">
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
      </div>
      {/* TODO: Use textareas with fixed height */}
      <Input
        {...getInputProps(uploadFields.description, { type: "text" })}
        maxLength={IMAGE_DESCRIPTION_MAX_LENGTH}
      >
        <Input.Label htmlFor={uploadFields.description.id}>
          {locales.route.changeBackground.description.label}
        </Input.Label>
        {typeof uploadFields.description.errors !== "undefined" &&
        uploadFields.description.errors.length > 0 ? (
          uploadFields.description.errors.map((error) => (
            <Input.Error id={uploadFields.description.errorId} key={error}>
              {error}
            </Input.Error>
          ))
        ) : (
          <Input.HelperText>
            {locales.route.changeBackground.description.helperText}
          </Input.HelperText>
        )}
      </Input>
      <Input
        {...getInputProps(uploadFields.credits, { type: "text" })}
        maxLength={IMAGE_CREDITS_MAX_LENGTH}
      >
        <Input.Label htmlFor={uploadFields.credits.id}>
          {locales.route.changeBackground.credits.label}
        </Input.Label>
        {typeof uploadFields.credits.errors !== "undefined" &&
        uploadFields.credits.errors.length > 0 ? (
          uploadFields.credits.errors.map((error) => (
            <Input.Error id={uploadFields.credits.errorId} key={error}>
              {error}
            </Input.Error>
          ))
        ) : (
          <Input.HelperText>
            {locales.route.changeBackground.credits.helperText}
          </Input.HelperText>
        )}
      </Input>
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
  );
}

export default Background;
