import React from "react";

export type InputImageProps = {
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
} & Pick<React.HTMLProps<HTMLInputElement>, "id" | "name" | "accept">;

function InputImage(props: InputImageProps) {
  const {
    maxSize,
    maxWidth,
    maxHeight,
    accept = "image/*",
    ...otherProps
  } = props;

  const [error, setError] = React.useState<Error | null>(null);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const fileList = event.target.files;

    if (fileList === null || fileList[0] == undefined) {
      setError(new Error("No files received"));
      return;
    }

    const file = fileList[0];

    if (maxSize !== undefined && file.size > maxSize) {
      setError(new Error(`Image to large (max. ${maxSize} Byte)`));
      return;
    }

    const image = new Image();

    image.onload = () => {
      if (maxWidth !== undefined && image.width > maxWidth) {
        setError(new Error(`Image width to large (max. ${maxWidth} px)`));
        return;
      }
      if (maxHeight !== undefined && image.height > maxHeight) {
        setError(new Error(`Image height to large (max. ${maxHeight} px)`));
        return;
      }

      setError(null);
    };

    image.src = URL.createObjectURL(file);
  };

  return (
    <>
      <input
        type="file"
        onChange={handleChange}
        accept={accept}
        {...otherProps}
      />
      {error !== null && <p>{error.message}</p>}
    </>
  );
}

export default InputImage;
