import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import {
  DOCUMENT_DESCRIPTION_MAX_LENGTH,
  MAX_UPLOAD_FILE_SIZE,
  nextGetUploadDocumentSchema,
  UPLOAD_DOCUMENT_INTENT_VALUE,
} from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { uploadDocumentToEvent } from "./add.server";
import { getEventBySlug } from "./list.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import List from "~/components/next/List";
import ListItemMaterial from "~/components/next/ListItemMaterial";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/add"];

  return { locales };
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
    languageModuleMap[language]["next/event/$slug/settings/documents/add"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();

  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(intent === UPLOAD_DOCUMENT_INTENT_VALUE, "unknown intent", {
    status: 400,
  });

  const submission = await parseWithZod(formData, {
    schema: nextGetUploadDocumentSchema(locales.route.validation),
  });

  if (submission.status !== "success") {
    captureException(submission.error);
    return redirectWithToast(request.url, {
      id: "upload-document-error",
      key: `upload-document-error-${Date.now()}`,
      message: locales.route.errors.uploadDocumentFailed,
      level: "negative",
    });
  }

  try {
    await uploadDocumentToEvent({
      authClient,
      slug: params.slug,
      file: submission.value.file,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "upload-document-error",
      key: `upload-document-error-${Date.now()}`,
      message: locales.route.errors.uploadDocumentFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "upload-document-success",
    key: `upload-document-success-${Date.now()}`,
    message: locales.route.success.documentAdded,
    level: "positive",
  });
}

function DocumentsList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;

  return (
    <>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.title}
        </h3>
        <p>
          {insertParametersIntoLocale(locales.route.explanation, {
            size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
          })}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.route.help, [
            <Link
              key="help-link"
              // TODO: Correct # parameter when FAQ is ready
              to="/help"
              target="_blank"
              className="text-primary font-semibold underline"
              prefetch="intent"
            />,
          ])}
        </p>
      </div>
      <Form
        // TODO: Connect with form
        // {...getFormProps(editForm)}
        method="POST"
        preventScrollReset
        hidden
      />
      {/* TODO: File Input connected with Form */}
      {/* TODO: Only show this when no file selected */}
      <div className="flex md:justify-end">
        <div className="w-full md:w-fit">
          <Button fullSize variant="outline">
            {locales.route.add.pick}
          </Button>
        </div>
      </div>
      {/* TODO: Hide this on no file selected */}
      {/* TODO: Fill with document data from file input */}
      {/* TODO: clearFileInput button top right */}
      {/* <List id="documents-list" locales={locales.route.add.list}>
        <ListItemMaterial
          index={0}
          type={document.mimeType === "application/pdf" ? "pdf" : "image"}
          sizeInMB={document.sizeInMB}
        >
          {document.mimeType !== "application/pdf" ? (
            <ListItemMaterial.Image
              alt={document.title || document.filename}
              src="TODO:"
              blurredSrc="TODO:"
            />
          ) : null}
          <ListItemMaterial.Headline>
            {document.title || document.filename}
          </ListItemMaterial.Headline>
          {hasContent(document.credits) && (
            <ListItemMaterial.Subline>
              © {document.credits}
            </ListItemMaterial.Subline>
          )}
        </ListItemMaterial>
      </List> */}
      <Input
      // TODO: Connect with form
      // {...getInputProps(editFields.title, { type: "text" })}
      >
        <Input.Label
        // TODO: Connect with form
        // htmlFor={editFields.title.id}
        >
          {locales.route.add.title.label}
        </Input.Label>
        {/* TODO: Connect with form */}
        {/* {typeof editFields.title.errors !== "undefined" &&
        editFields.title.errors.length > 0
          ? editFields.title.errors.map((error) => (
              <Input.Error id={editFields.title.errorId} key={error}>
                {error}
              </Input.Error>
            ))
          : (
              <Input.HelperText>{locales.route.add.title.helperText}</Input.HelperText>
            )} */}
      </Input>
      <Input
        // TODO: Connect with form
        // {...getInputProps(editFields.description, { type: "text" })}
        maxLength={DOCUMENT_DESCRIPTION_MAX_LENGTH}
      >
        <Input.Label
        // TODO: Connect with form
        // htmlFor={editFields.description.id}
        >
          {locales.route.add.description.label}
        </Input.Label>
        {/* TODO: Connect with form */}
        {/* {typeof editFields.description.errors !== "undefined" &&
        editFields.description.errors.length > 0 ? (
          editFields.description.errors.map((error) => (
            <Input.Error id={editFields.description.errorId} key={error}>
              {error}
            </Input.Error>
          ))
        ) : (
          <Input.HelperText>{locales.route.add.description.helperText}</Input.HelperText>
        )} */}
      </Input>
      <div className="w-full flex md:justify-end">
        <div className="w-full md:w-fit flex flex-col md:flex-row-reverse gap-4">
          <div className="w-full md:w-fit">
            <Button
              type="submit"
              fullSize
              // TODO: Connect with form
              // form={form.id} // Don't disable button when js is disabled
              // disabled={
              //   isHydrated
              //     ? form.dirty === false ||
              //       form.valid === false ||
              //       isSubmitting
              //     : false
              // }
            >
              {locales.route.add.upload}
            </Button>
          </div>
          <div className="w-full md:w-fit">
            <div className="relative w-full">
              <Button
                type="reset"
                // TODO: Connect with form
                // onClick={() => {
                //   form.reset();
                // }}
                variant="outline"
                fullSize
                // TODO: Connect with form
                // Don't disable button when js is disabled
                // disabled={isHydrated ? form.dirty === false : false}
              >
                {locales.route.add.cancel}
              </Button>
              <noscript className="absolute top-0">
                <Button as="link" to="." variant="outline" fullSize>
                  {locales.route.add.cancel}
                </Button>
              </noscript>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DocumentsList;
