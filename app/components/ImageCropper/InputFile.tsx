import * as React from "react";

interface InputFileProps {
  id: string;
  hasImage: boolean;
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function InputFile({ id, hasImage, onSelectFile }: InputFileProps) {
  return (
    <>
      <label
        htmlFor={id}
        className="flex content-center items-center nowrap py-2 cursor-pointer text-primary overflow-hidden"
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
        <span className="ml-2">
          {hasImage && "neues "}
          Bild auswählen
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="opacity-0 w-0 h-0 overflow-hidden"
      />
    </>
  );
}
