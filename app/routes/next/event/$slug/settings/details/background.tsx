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

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details/background"];

  return { locales };
}

function Background() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const isHydrated = useHydrated();

  const [selectedFiles, setSelectedFiles] = useState<
    {
      id: string;
      filename: string;
      sizeInMB: number;
    }[]
  >([]);

  return (
    <>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.title}
        </h3>
        <p>
          {insertParametersIntoLocale(locales.route.fileExplanation, {
            size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
          })}
        </p>
        <p>
          {insertParametersIntoLocale(locales.route.aspectExplanation, {
            aspectRatio: ImageAspectsAsStrings.EventBackground,
            minWidth: MaxImageSizes.EventBackground.width,
          })}
        </p>
      </div>
      <div className="w-full rounded-md overflow-hidden">
        <Image
          alt={locales.route.currentBackground.title}
          src={eventDefaultBackground}
          blurredSrc={eventDefaultBackgroundBlurred}
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
            setSelectedFiles(
              event.target.files !== null
                ? Array.from(event.target.files).map((file) => {
                    return {
                      id: crypto.randomUUID(),
                      filename: file.name,
                      sizeInMB:
                        Math.round((file.size / 1000 / 1000) * 100) / 100,
                    };
                  })
                : []
            );
            // TODO: Conform
            // uploadForm.validate();
          }}
        />
      </Form>
      {selectedFiles.length === 0 && isHydrated ? (
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
      ) : (
        <>
          {isHydrated ? (
            <>
              {selectedFiles.map((image, index) => {
                return <>{/* Javascript dependent code */}</>;
              })}
            </>
          ) : null}
          {/* Javascript independent code */}
        </>
      )}
    </>
  );
}

export default Background;
