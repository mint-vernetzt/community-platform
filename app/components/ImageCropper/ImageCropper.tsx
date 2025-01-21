import Pica from "pica";
import React, { useRef, useState } from "react";

import type { Crop, PixelCrop } from "react-image-crop";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";

import Slider from "rc-slider";
import { fileUploadSchema } from "~/lib/utils/schemas";
import { type Subject, type UploadKey } from "~/routes/upload/utils.server";
import { InputFile } from "./InputFile";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import { RemixFormsForm } from "../RemixFormsForm/RemixFormsForm";
import { Form, type SubmitFunction, useSubmit } from "@remix-run/react";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type OrganizationDetailLocales } from "~/routes/organization/$slug/detail.server";
import { type EventDetailLocales } from "~/routes/event/$slug/index.server";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";
import { type ProjectDetailLocales } from "~/routes/project/$slug/detail.server";

export interface ImageCropperProps {
  id: string;
  subject: Subject;
  slug?: string;
  uploadKey: UploadKey;
  aspect?: number | null;
  image?: string;
  minCropHeight: number;
  minCropWidth: number;
  maxTargetWidth: number;
  maxTargetHeight: number;
  redirect?: string;
  handleCancel?: () => void;
  children: React.ReactNode;
  circularCrop?: boolean;
  modalSearchParam?: string;
  locales:
    | OrganizationDetailLocales
    | EventDetailLocales
    | ProfileDetailLocales
    | ProjectDetailLocales;
}

/**
 * credits
 * @link https://codesandbox.io/s/react-image-crop-demo-with-react-hooks-y831o?file=/public/index.html
 * @link https://stackoverflow.com/questions/53607046/i-am-using-react-image-crop-with-react-and-express-to-upload-profile-pic-with-cr
 * @link https://codesandbox.io/s/72py4jlll6?file=/src/index.js:1229-2419
 */

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const IMAGE_QUALITY = 1.0;
const DEFAULT_SCALE = 1.0;
const IMAGE_MIME = "image/jpeg";
const DEFAULT_ASPECT = 16 / 9;
const UPLOAD_URL = "/upload/image";
const DELETE_URL = "/upload/delete";

function ImageCropper(props: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isSaving, setIsSaving] = useState(false);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const aspect = props.aspect === undefined ? DEFAULT_ASPECT : props.aspect;

  const {
    id,
    image,
    minCropWidth,
    minCropHeight,
    maxTargetWidth,
    maxTargetHeight,
    handleCancel,
    circularCrop = false,
    locales,
  } = props;

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(file);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const givenAspectOrFull = aspect ? aspect : width / height;
    setCrop(centerAspectCrop(width, height, givenAspectOrFull));
  }

  // https://stackoverflow.com/questions/18761404/how-to-scale-images-on-a-html5-canvas-with-better-interpolation

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          0
        );
      }
    },
    100,
    [completedCrop, scale]
  );

  function reset() {
    // TODO: can this type assertion be removed and proofen by code?
    const inputFile = document.getElementById(`${id}-file`) as HTMLInputElement;
    if (inputFile === null) {
      return;
    }

    if (inputFile && inputFile.files && inputFile.files.length > 0) {
      inputFile.value = "";
    }

    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  }

  async function scaleDown(canvas: HTMLCanvasElement, width: number) {
    // TODO: can this type assertion be removed and proofen by code?
    const targetCanvas = document.createElement("canvas") as HTMLCanvasElement;
    targetCanvas.className = "hidden";
    const canvasAspect = canvas.width / canvas.height;
    const isLandScape = canvas.width > canvas.height;
    targetCanvas.width = Math.ceil(width * (isLandScape ? 1 : canvasAspect));
    targetCanvas.height = Math.ceil(width / (!isLandScape ? 1 : canvasAspect));

    const pica = new Pica();
    const result = await pica.resize(canvas, targetCanvas);
    return result;
  }

  async function handleSave(
    e: React.SyntheticEvent<HTMLButtonElement>,
    submit: SubmitFunction
  ) {
    e.preventDefault();
    const previewCanvas = previewCanvasRef.current;
    let resultCanvas;

    try {
      if (previewCanvas) {
        if (
          previewCanvas.width > maxTargetWidth ||
          previewCanvas.height > maxTargetHeight
        ) {
          resultCanvas = await scaleDown(previewCanvas, maxTargetWidth);
        } else {
          resultCanvas = previewCanvas;
        }

        // document.body.append(resultCanvas);

        resultCanvas.toBlob(
          (blob) => {
            const formData = new FormData();
            formData.append(props.uploadKey, blob ?? "");
            formData.append("subject", props.subject);
            formData.append("uploadKey", props.uploadKey);

            if (props.redirect) {
              formData.append("redirect", props.redirect);
            }

            if (props.slug) {
              formData.append("slug", props.slug);
            }

            fetch(UPLOAD_URL, { method: "POST", body: formData })
              .then((response) => {
                if (response.ok) {
                  return response;
                } else {
                  throw Error(
                    `Server returned ${response.status}: ${response.statusText}`
                  );
                }
              })
              .catch((err) => {
                reset();

                console.error({ err });

                alert(locales.imageCropper.imageCropper.error);
              })
              .finally(() => {
                submit(e.currentTarget, { preventScrollReset: true });
              });
          },
          IMAGE_MIME,
          IMAGE_QUALITY
        );
      }
    } catch (exception) {
      console.log({ exception });
      alert(locales.imageCropper.imageCropper.error);
    }
  }

  function handleZoomClick(e: React.SyntheticEvent<HTMLButtonElement>) {
    e.preventDefault();

    const buttonId = e.currentTarget.id;
    if (buttonId === "scaleDown") {
      setScale(scale - 0.1);
    }
    if (buttonId === "scaleUp") {
      setScale(scale + 0.1);
    }
  }

  const submit = useSubmit();

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <div className="relative max-h-72">
          {!imgSrc && props.children}
          {image && !completedCrop && (
            <RemixFormsForm
              action={DELETE_URL}
              method="post"
              schema={fileUploadSchema}
              hiddenFields={["subject", "slug", "uploadKey", "redirect"]}
              values={{
                subject: props.subject,
                slug: props.slug,
                uploadKey: props.uploadKey,
                redirect: props.redirect,
              }}
              preventScrollReset
            >
              {({ Field }) => (
                <>
                  <Field name="subject" />
                  <Field name="slug" />
                  <Field name="uploadKey" />
                  <Field name="redirect" />
                  <button
                    className={`bg-transparent w-8 h-8 p-0 border-transparent absolute ${
                      props.uploadKey === "logo" || props.uploadKey === "avatar"
                        ? "top-1 right-1"
                        : "-top-3 -right-3"
                    } rounded-full border-2 border-neutral-200`}
                    type="submit"
                    disabled={isSaving}
                    onClick={(e) => {
                      if (
                        !confirm(locales.imageCropper.imageCropper.confirmation)
                      ) {
                        e.preventDefault();
                      } else {
                        submit(e.currentTarget);
                      }
                    }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-auto"
                    >
                      <circle cx="16" cy="16" r="16" fill="#EE7775" />
                      <path
                        d="M9.29196 9.29208C9.38485 9.19895 9.4952 9.12507 9.61669 9.07465C9.73818 9.02424 9.86842 8.99829 9.99996 8.99829C10.1315 8.99829 10.2617 9.02424 10.3832 9.07465C10.5047 9.12507 10.6151 9.19895 10.708 9.29208L16 14.5861L21.292 9.29208C21.3849 9.1991 21.4953 9.12535 21.6168 9.07503C21.7383 9.02471 21.8685 8.99881 22 8.99881C22.1314 8.99881 22.2616 9.02471 22.3831 9.07503C22.5046 9.12535 22.615 9.1991 22.708 9.29208C22.8009 9.38505 22.8747 9.49543 22.925 9.61691C22.9753 9.73839 23.0012 9.86859 23.0012 10.0001C23.0012 10.1316 22.9753 10.2618 22.925 10.3832C22.8747 10.5047 22.8009 10.6151 22.708 10.7081L17.414 16.0001L22.708 21.2921C22.8009 21.3851 22.8747 21.4954 22.925 21.6169C22.9753 21.7384 23.0012 21.8686 23.0012 22.0001C23.0012 22.1316 22.9753 22.2618 22.925 22.3832C22.8747 22.5047 22.8009 22.6151 22.708 22.7081C22.615 22.8011 22.5046 22.8748 22.3831 22.9251C22.2616 22.9754 22.1314 23.0013 22 23.0013C21.8685 23.0013 21.7383 22.9754 21.6168 22.9251C21.4953 22.8748 21.3849 22.8011 21.292 22.7081L16 17.4141L10.708 22.7081C10.615 22.8011 10.5046 22.8748 10.3831 22.9251C10.2616 22.9754 10.1314 23.0013 9.99996 23.0013C9.86847 23.0013 9.73827 22.9754 9.61679 22.9251C9.49531 22.8748 9.38493 22.8011 9.29196 22.7081C9.19898 22.6151 9.12523 22.5047 9.07491 22.3832C9.02459 22.2618 8.99869 22.1316 8.99869 22.0001C8.99869 21.8686 9.02459 21.7384 9.07491 21.6169C9.12523 21.4954 9.19898 21.3851 9.29196 21.2921L14.586 16.0001L9.29196 10.7081C9.19883 10.6152 9.12494 10.5048 9.07453 10.3833C9.02412 10.2619 8.99817 10.1316 8.99817 10.0001C8.99817 9.86854 9.02412 9.7383 9.07453 9.61681C9.12494 9.49532 9.19883 9.38497 9.29196 9.29208Z"
                        fill="#FCFCFD"
                      />
                    </svg>
                  </button>
                </>
              )}
            </RemixFormsForm>
          )}

          {Boolean(imgSrc) && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect ?? undefined}
              minWidth={minCropWidth}
              minHeight={minCropHeight}
              style={{ maxHeight: "288px" }}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop Preview"
                src={imgSrc}
                style={{ transform: `scale(${scale})` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>
      </div>
      <div>
        {Boolean(completedCrop) && (
          <canvas
            ref={previewCanvasRef}
            style={{
              objectFit: "contain",
              width: completedCrop?.width ?? 0,
              height: completedCrop?.height ?? 0,
              display: "none",
            }}
          />
        )}
      </div>
      <div className="Crop-Controls flex flex-col items-center w-full">
        <InputFile
          id={`${id}-file`}
          onSelectFile={onSelectFile}
          hasImage={image !== undefined}
          locales={locales}
        />
        {imgSrc && (
          <div className="flex items-center w-full mb-2">
            <div className="flex-auto w-1/2 @md:mv-w-[calc(25%+1rem)] flex justify-end px-4 @md:mv-px2">
              <button
                id="scaleDown"
                className="bg-white border border-primary h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary text-primary hover:text-white"
                onClick={handleZoomClick}
              >
                <svg
                  width="11"
                  height="3"
                  viewBox="0 0 11 3"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.398682 1.41893C0.398682 0.898206 0.68838 0.476074 1.04574 0.476074H10.1046C10.4619 0.476074 10.7516 0.898206 10.7516 1.41893C10.7516 1.93966 10.4619 2.36179 10.1046 2.36179H1.04574C0.68838 2.36179 0.398682 1.93966 0.398682 1.41893Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <div className="w-[250px] py-2 hidden @md:mv-block @md:mv-w-[calc(50%-2rem)] @md:mv-px2">
              <Slider
                min={0.1}
                max={DEFAULT_SCALE * 2}
                step={0.05}
                value={scale}
                // TODO: can this type assertion be removed and proofen by code?
                onChange={(v) => setScale(v as number)}
              />
            </div>
            <div className="flex-auto w-1/2 @md:mv-w-[calc(25%+1rem)] flex justify-start px-4 @md:mv-px2">
              <button
                id="scaleUp"
                className="bg-white border border-primary h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary text-primary hover:text-white"
                onClick={handleZoomClick}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 0C6.41421 0 6.75 0.335786 6.75 0.75V5.25H11.25C11.6642 5.25 12 5.58579 12 6C12 6.41421 11.6642 6.75 11.25 6.75H6.75V11.25C6.75 11.6642 6.41421 12 6 12C5.58579 12 5.25 11.6642 5.25 11.25V6.75H0.75C0.335786 6.75 0 6.41421 0 6C0 5.58579 0.335786 5.25 0.75 5.25H5.25V0.75C5.25 0.335786 5.58579 0 6 0Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-8 w-full mt-2">
        <Form method="get" preventScrollReset>
          <input
            hidden
            name={props.modalSearchParam || "modal"}
            defaultValue="false"
          />
          <Button
            type="submit"
            className="mv-p-5"
            onClick={() => {
              reset();
              handleCancel && handleCancel();
            }}
          >
            {locales.imageCropper.imageCropper.reset}
          </Button>
        </Form>

        <Form method="get" className="justify-self-end" preventScrollReset>
          <input
            hidden
            name={props.modalSearchParam || "modal"}
            defaultValue="false"
          />
          <Button
            type="submit"
            className="mv-p-5"
            disabled={isSaving || !imgSrc}
            onClick={(event: React.SyntheticEvent<HTMLButtonElement>) => {
              setIsSaving(true);
              handleSave(event, submit);
            }}
          >
            {locales.imageCropper.imageCropper.submit}
            {isSaving && "..."}
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default ImageCropper;
