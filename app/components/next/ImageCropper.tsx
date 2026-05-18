import { type Dispatch, type SetStateAction, useState } from "react";
import Cropper, {
  type Point,
  type Area,
  type CropperProps,
} from "react-easy-crop";
import { Pica } from "pica";
import { MaxImageSizes } from "~/images.shared";
import Slider from "rc-slider";
import { SquareButton } from "@mint-vernetzt/components/src/molecules/SquareButton";
import { useNonce } from "~/nonce-provider";

function ImageCropper(props: {
  src: CropperProps["image"];
  aspect: CropperProps["aspect"];
  setCroppedArea: Dispatch<SetStateAction<Area | null>>;
  shape?: CropperProps["cropShape"];
}) {
  const nonce = useNonce();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    props.setCroppedArea(croppedAreaPixels);
  };

  return (
    <>
      <div className="relative w-full aspect-3/2 rounded-md overflow-hidden">
        <Cropper
          image={props.src}
          crop={crop}
          zoom={zoom}
          aspect={props.aspect}
          cropShape={props.shape}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          objectFit="contain"
          disableAutomaticStylesInjection
        />
      </div>
      <div className="flex items-center w-full gap-4">
        <SquareButton
          variant="outline"
          size="small"
          onClick={() => {
            setZoom((prev) => Math.max(prev - 0.1, 1));
          }}
        >
          <span className="w-full h-full flex items-center justify-center">
            <svg
              width="12"
              height="2"
              viewBox="0 0 12 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0.75C0 0.335786 0.335786 0 0.75 0H11.25C11.6642 0 12 0.335786 12 0.75C12 1.16421 11.6642 1.5 11.25 1.5H0.75C0.335786 1.5 0 1.16421 0 0.75Z"
                fill="#154194"
              />
            </svg>
          </span>
        </SquareButton>
        <Slider
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(v) => {
            if (Array.isArray(v)) {
              if (v.length > 0) {
                return setZoom(v[0]);
              } else {
                return setZoom(1);
              }
            }
            return setZoom(v);
          }}
        />
        <SquareButton
          variant="outline"
          size="small"
          onClick={() => {
            setZoom((prev) => {
              return Math.min(prev + 0.1, 3);
            });
          }}
        >
          <span className="w-full h-full flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 0C6.41421 0 6.75 0.335786 6.75 0.75V5.25H11.25C11.6642 5.25 12 5.58579 12 6C12 6.41421 11.6642 6.75 11.25 6.75H6.75V11.25C6.75 11.6642 6.41421 12 6 12C5.58579 12 5.25 11.6642 5.25 11.25V6.75H0.75C0.335786 6.75 0 6.41421 0 6C0 5.58579 0.335786 5.25 0.75 5.25H5.25V0.75C5.25 0.335786 5.58579 0 6 0Z"
                fill="#154194"
              />
            </svg>
          </span>
        </SquareButton>
      </div>
    </>
  );
}

export async function croppedAreaToBlob(options: {
  croppedArea: Area;
  sourceImage: {
    src: string;
    filename: string;
  };
}) {
  const { croppedArea, sourceImage } = options;

  const sourceImageElement = new Image();
  sourceImageElement.src = sourceImage.src;
  await new Promise((resolve) => (sourceImageElement.onload = resolve));

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = croppedArea.width;
  cropCanvas.height = croppedArea.height;

  const ctx = cropCanvas.getContext("2d");
  if (ctx === null) throw new Error("Could not get canvas context");

  ctx.drawImage(
    sourceImageElement,
    croppedArea.x,
    croppedArea.y,
    croppedArea.width,
    croppedArea.height,
    0,
    0,
    croppedArea.width,
    croppedArea.height
  );

  const aspectRatio = croppedArea.height / croppedArea.width;
  const targetWidth = Math.min(
    MaxImageSizes.EventBackground.width,
    croppedArea.width
  );
  const targetHeight = Math.round(targetWidth * aspectRatio);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  const pica = new Pica({
    features: ["js"],
  });
  const resultCanvas = await pica.resize(cropCanvas, outputCanvas);

  return new Promise<Blob>((resolve, reject) => {
    resultCanvas.toBlob(
      (blob) => {
        if (blob === null) return reject(new Error("Could not create blob"));
        resolve(blob);
      },
      "image/jpeg",
      1
    );
  });
}

export default ImageCropper;
