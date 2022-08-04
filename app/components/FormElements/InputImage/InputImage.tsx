import React from "react";

export type InputImageProps = {
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  classes?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  containerClassName: string;
  imageClassName: string;
} & Pick<React.HTMLProps<HTMLInputElement>, "id" | "name" | "accept">;

function InputImage(props: InputImageProps) {
  const {
    maxSize,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    classes,
    accept = "image/*",
    containerRef,
    containerClassName,
    imageClassName,
    ...otherProps
  } = props;

  const [error, setError] = React.useState<Error | null>(null);
  const [selectedImage, setSelectedImage] =
    React.useState<HTMLImageElement | null>(null);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const fileList = event.target.files;

    if (fileList === null || fileList[0] == undefined) {
      setError(new Error("Das Bild wurde nicht empfangen."));
      return;
    }

    const file = fileList[0];

    if (maxSize !== undefined && file.size > maxSize) {
      setError(
        new Error(
          `Bild zu groß (max. ${Math.round(maxSize / 100000) / 10} MB).`
        )
      );
      return;
    }

    const image = new Image();

    image.onload = () => {
      if (
        minWidth !== undefined &&
        minHeight !== undefined &&
        (image.width < minWidth || image.height < minHeight)
      ) {
        setError(
          new Error(`Bild zu klein (min. ${minWidth} x ${minHeight} px).`)
        );
        return;
      }
      if (
        maxWidth !== undefined &&
        maxHeight !== undefined &&
        (image.width > maxWidth || image.height > maxHeight)
      ) {
        setError(
          new Error(`Bild zu groß (max. ${maxWidth} x ${maxHeight} px).`)
        );
        return;
      }
      if (containerRef !== null && containerRef.current !== null) {
        containerRef.current.innerHTML = "";
        if (imageClassName !== "") {
          imageClassName.split(" ").map((className) => {
            return image.classList.add(className);
          });
        }
        if (containerClassName !== "") {
          containerClassName.split(" ").map((className) => {
            return containerRef.current?.classList.add(className);
          });
        }
        containerRef.current.appendChild(image);
      }
      setSelectedImage(image);
      setError(null);
    };

    image.src = URL.createObjectURL(file);
  };

  return (
    <>
      <label
        htmlFor={props.id}
        className="flex content-center items-center nowrap py-2 cursor-pointer text-primary"
      >
        <svg
          width="17"
          height="16"
          viewBox="0 0 17 16"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-neutral-600"
        >
          <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
        </svg>
        <span className="ml-2 mr-4">Bild auswählen</span>
      </label>
      <input
        type="file"
        onChange={handleChange}
        accept={accept}
        {...otherProps}
        className={classes}
      />

      {selectedImage !== null && error === null && (
        <button className="btn btn-primary btn-small">Bild hochladen</button>
      )}
      {error !== null && <p>{error.message}</p>}
    </>
  );
}

export default InputImage;
