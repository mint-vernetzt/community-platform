import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Form, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { ImageAspectsAsStrings, MaxImageSizes } from "~/images.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { IMAGE_MIME_TYPES, MAX_UPLOAD_FILE_SIZE } from "~/storage.shared";
import eventDefaultBackground from "~/assets/default-event-background.jpg";
import eventDefaultBackgroundBlurred from "~/assets/default-event-background-blurred.jpg";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useHydrated } from "remix-utils/use-hydrated";
import { useState } from "react";
import { UploadIcon } from "~/components-next/icons/UploadIcon";
import TitleSection from "~/components/next/TitleSection";
import { getEventBackground } from "./background.server";
import { createAuthClient } from "~/auth.server";

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

// TODO: Action with upload and remove intent
// TODO: check prisma schema and how we can connect background field to Document model

function Background() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, background } = loaderData;

  const isHydrated = useHydrated();

  const [selectedFiles, setSelectedFiles] = useState<
    {
      filename: string;
      sizeInMB: number;
      src: string;
    }[]
  >([]);

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
      {/* TODO: Either pass selectedFile or current background or default background */}
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
        // TODO: Conform
        // {...getFormProps(uploadForm)}
        method="POST"
        encType="multipart/form-data"
        hidden={isHydrated}
      >
        {/* TODO: Conform */}
        {/* <input
          name={INTENT_FIELD_NAME}
          type="hidden"
          value={UPLOAD_DOCUMENT_INTENT_VALUE}
        /> */}
        <input
          // TODO: Conform
          // {...getInputProps(uploadFields[FILE_FIELD_NAME], {
          //   type: "file",
          // })}
          id="file-input"
          type="file"
          className="cursor-pointer"
          accept={IMAGE_MIME_TYPES.join(", ")}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
            // TODO: Conform
            // uploadForm.validate();
          }}
        />
      </Form>
      <div className="flex md:justify-end">
        <div className="w-full md:w-fit">
          <Button
            as="label"
            htmlFor="file-input"
            // TODO: Conform
            // htmlFor={uploadFields[FILE_FIELD_NAME].id}
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
      {/* TODO: Conform form with inputs description, credits and upload intent */}
      {/* Javascript independent code */}
    </>
  );
}

export default Background;
