import React, { useState, useRef } from "react";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import { Form } from "remix-forms";

import { canvasPreview } from "./canvasPreview";
import { InputFile } from "./InputFile";
import { useDebounceEffect } from "./useDebounceEffect";
import { schema, UploadKey, Subject } from "~/routes/upload/schema";

export interface ImageCropperProps {
  id: string;
  headline: string;
  subject: Subject;
  slug?: string;
  uploadKey: UploadKey;
  aspect?: number;
  image?: string;
  minHeight: number;
  minWidth: number;
  redirect?: string;
  handleCancel?: () => void;
  children: React.ReactNode;
  csrfToken: string;
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
  const [scale, setScale] = useState(1.0);
  const aspect = props.aspect ?? DEFAULT_ASPECT;

  const { id, headline, image, minWidth, minHeight, handleCancel } = props;

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

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

  function handleSave(e: React.SyntheticEvent<HTMLButtonElement>) {
    e.preventDefault();
    const canvas = previewCanvasRef.current;
    if (canvas) {
      setIsSaving(true);

      canvas.toBlob(
        (blob) => {
          const formData = new FormData();
          formData.append(props.uploadKey, blob ?? "");
          formData.append("subject", props.subject);
          formData.append("uploadKey", props.uploadKey);
          formData.append("csrf", props.csrfToken);

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
              } else
                throw Error(
                  `Server returned ${response.status}: ${response.statusText}`
                );
            })
            .then((response) => {
              setIsSaving(false);
              document.location.reload();
            })
            .catch((err) => {
              alert(err);
            });
        },
        IMAGE_MIME,
        IMAGE_QUALITY
      );
    }
  }

  function handleScaleClick(e: React.SyntheticEvent<HTMLButtonElement>) {
    e.preventDefault();

    const buttonId = e.currentTarget.id;
    if (buttonId === "scaleDown") {
      setScale(scale - 0.1);
    }
    if (buttonId === "scaleUp") {
      setScale(scale + 0.1);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center font-bolder">{headline}</h2>
      <div>
        {!imgSrc && props.children}

        {Boolean(imgSrc) && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={minWidth}
            minHeight={minHeight}
            style={{ maxHeight: "288px" }}
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
      <div className="Crop-Controls flex flex-col items-center">
        <InputFile
          id={`${id}-file`}
          onSelectFile={onSelectFile}
          hasImage={image !== undefined}
        />
        {imgSrc && (
          <div>
            <button
              id="scaleUp"
              className="btn btn-outline btn-primary"
              onClick={handleScaleClick}
            >
              +
            </button>
            <button
              id="scaleDown"
              className="btn btn-outline btn-primary"
              onClick={handleScaleClick}
            >
              -
            </button>
          </div>
        )}

        {image && !completedCrop && (
          <Form
            action={DELETE_URL}
            method="post"
            reloadDocument
            schema={schema}
            hiddenFields={["subject", "slug", "uploadKey", "csrf", "redirect"]}
            values={{
              subject: props.subject,
              slug: props.slug,
              uploadKey: props.uploadKey,
              csrf: props.csrfToken,
              redirect: props.redirect,
            }}
          >
            {({ Field }) => (
              <>
                <Field name="subject" />
                <Field name="slug" />
                <Field name="csrf" />
                <Field name="uploadKey" />
                <Field name="redirect" />
                <button
                  className="btn btn-link"
                  type="submit"
                  disabled={isSaving}
                  onClick={(e) => {
                    if (!confirm("Bild wirklich entfernen?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Bild entfernen
                </button>
              </>
            )}
          </Form>
        )}
      </div>
      <div className="flex justify-between w-full items-stretch ">
        <label
          htmlFor={id}
          className="btn btn-link p-5"
          onClick={() => {
            const inputFile = document.getElementById(`${id}-file`);
            if (inputFile) {
              setCrop(undefined); // Makes crop preview update between images.
              setImgSrc("");
            }

            handleCancel && handleCancel();
          }}
        >
          Abbrechen
        </label>

        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={isSaving || !imgSrc}
        >
          Speichern{isSaving && "..."}
        </button>
      </div>
    </div>
  );
}

export default ImageCropper;
