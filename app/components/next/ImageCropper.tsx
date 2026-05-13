import { type Dispatch, type SetStateAction, useState } from "react";
import Cropper, {
  type Point,
  type Area,
  type CropperProps,
} from "react-easy-crop";

function ImageCropper(props: {
  src: CropperProps["image"];
  aspect: CropperProps["aspect"];
  setFile: Dispatch<SetStateAction<File>>;
  shape?: CropperProps["cropShape"];
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    console.log(croppedArea, croppedAreaPixels);
  };

  return (
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
    />
  );
}

// TODO: Controls

export default ImageCropper;
