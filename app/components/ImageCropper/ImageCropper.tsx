import React, { useState, useRef } from "react";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";

export interface ImageCropperProps {
  uploadUrl: string;
  uploadKey: "avatar" | "background";
  aspect?: number;
  image?: string;
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

const DEFAULT_ASPECT = 16 / 9;

function ImageCropper(props: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const currentAspect = props.aspect ?? DEFAULT_ASPECT;
  const [aspect, setAspect] = useState<number | undefined>(() => {
    return currentAspect;
  });

  const { uploadUrl, image } = props;

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
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  function handleToggleAspectClick() {
    if (aspect) {
      setAspect(undefined);
    } else if (imgRef.current) {
      const { width, height } = imgRef.current;
      setAspect(currentAspect);
      setCrop(centerAspectCrop(width, height, currentAspect));
    }
  }

  function handleSave(e: React.SyntheticEvent<HTMLButtonElement>) {
    e.preventDefault();
    const canvas = previewCanvasRef.current;
    if (canvas) {
      canvas.toBlob(
        (blob) => {
          const formData = new FormData();
          formData.append(props.uploadKey, blob ?? "");
          fetch(uploadUrl, { method: "POST", body: formData })
            .then((response) => {
              console.table(response);
              if (response.ok) return response;
              else
                throw Error(
                  `Server returned ${response.status}: ${response.statusText}`
                );
            })
            .then((response) => console.log(response.text()))
            .catch((err) => {
              alert(err);
            });
        },
        "image/jpeg",
        1
      );
    }
  }

  return (
    <div className="ImageCropper">
      <h2>Profilfoto</h2>
      {Boolean(imgSrc) && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imgSrc}
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      )}
      <div>
        {Boolean(completedCrop) && (
          <canvas
            ref={previewCanvasRef}
            style={{
              border: "1px solid black",
              objectFit: "contain",
              width: completedCrop?.width ?? 0,
              height: completedCrop?.height ?? 0,
            }}
          />
        )}
      </div>
      <div className="Crop-Controls">
        <input type="file" accept="image/*" onChange={onSelectFile} />
        <div>
          <label htmlFor="scale-input">Scale: </label>
          <input
            id="scale-input"
            type="number"
            step="0.1"
            value={scale}
            disabled={!imgSrc}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="rotate-input">Rotate: </label>
          <input
            id="rotate-input"
            type="number"
            value={rotate}
            disabled={!imgSrc}
            onChange={(e) =>
              setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
            }
          />
        </div>
        <div>
          <button onClick={handleToggleAspectClick}>
            Toggle aspect {aspect ? "off" : "on"}
          </button>
        </div>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

export default ImageCropper;
