import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import React from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import { type EventDocumentsSettingsLocales } from "~/routes/event/$slug/settings/documents.server";
import { type ProjectAttachmentSettingsLocales } from "~/routes/project/$slug/settings/attachments.server";
import { FILE_FIELD_NAME } from "~/storage.shared";

function FileInputText(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

function FileInputControls(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

export type SelectedFile = {
  name: string;
  sizeInMB: number;
};

type FileInputProps = {
  selectedFileNames: SelectedFile[];
  as?: "button" | "textButton";
  errors?: {
    id: string;
    message: string;
  }[];
  locales: ProjectAttachmentSettingsLocales | EventDocumentsSettingsLocales;
  fileInputProps?: React.HTMLProps<HTMLInputElement>;
  bucketInputProps?: React.HTMLProps<HTMLInputElement>;
  noscriptInputProps?: React.HTMLProps<HTMLInputElement>;
};

function FileInput(props: React.PropsWithChildren<FileInputProps>) {
  const {
    selectedFileNames,
    as = "button",
    errors,
    locales,
    fileInputProps,
    bucketInputProps,
    noscriptInputProps,
  } = props;
  const isHydrated = useHydrated();

  const children = React.Children.toArray(props.children) || [];

  const controls = children.filter((child) => {
    return React.isValidElement(child) && child.type === FileInputControls;
  });
  const text = children.filter((child) => {
    return React.isValidElement(child) && child.type === FileInputText;
  });

  return (
    <div
      className={`mv-flex mv-flex-col ${
        as === "button" ? "mv-gap-2" : "mv-gap-1"
      }`}
    >
      <noscript>
        <input
          {...noscriptInputProps}
          key={
            typeof noscriptInputProps !== "undefined"
              ? noscriptInputProps.key
              : undefined
          }
        />
      </noscript>
      <div className="mv-grid mv-grid-cols-2 mv-w-fit mv-gap-2">
        {as === "button" ? (
          isHydrated === true ? (
            <>
              <Button
                as="label"
                htmlFor={
                  typeof fileInputProps !== "undefined"
                    ? fileInputProps.id
                    : undefined
                }
              >
                {text}
              </Button>
              <input
                {...fileInputProps}
                key={
                  typeof fileInputProps !== "undefined"
                    ? fileInputProps.key
                    : undefined
                }
              />
            </>
          ) : (
            <Button as="label" disabled>
              {text}
            </Button>
          )
        ) : isHydrated === true ? (
          <>
            <label
              htmlFor={
                typeof fileInputProps !== "undefined"
                  ? fileInputProps.id
                  : undefined
              }
              className="mv-flex mv-content-center mv-items-center mv-nowrap mv-cursor-pointer mv-text-primary mv-overflow-hidden"
            >
              <svg
                width="17"
                height="16"
                viewBox="0 0 17 16"
                xmlns="http://www.w3.org/2000/svg"
                className="mv-fill-neutral-600"
              >
                <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
              </svg>
              <span className="mv-ml-2">{text}</span>
            </label>
            <input
              {...fileInputProps}
              key={
                typeof fileInputProps !== "undefined"
                  ? fileInputProps.key
                  : undefined
              }
            />
          </>
        ) : (
          <>
            <label
              htmlFor={FILE_FIELD_NAME}
              className="mv-flex mv-content-center mv-items-center mv-nowrap mv-cursor-pointer mv-text-neutral-400 mv-overflow-hidden"
            >
              <svg
                width="17"
                height="16"
                viewBox="0 0 17 16"
                xmlns="http://www.w3.org/2000/svg"
                className="mv-fill-neutral-300"
              >
                <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
              </svg>
              <span className="mv-ml-2">{text}</span>
            </label>
            <input
              {...fileInputProps}
              key={
                typeof fileInputProps !== "undefined"
                  ? fileInputProps.key
                  : undefined
              }
            />
          </>
        )}
        {controls.length > 0 ? controls : null}
      </div>
      <div className="mv-flex mv-flex-col mv-gap-2 mv-text-sm mv-font-semibold">
        {selectedFileNames.length > 0 ? (
          <p>
            {selectedFileNames
              .map((file) => {
                return `${file.name} (${file.sizeInMB} MB)`;
              })
              .join(", ")}
          </p>
        ) : isHydrated === true ? (
          locales.route.content.document.selection.empty
        ) : null}
        {typeof errors !== "undefined" && errors.length > 0 ? (
          <div>
            {errors.map((error, index) => {
              return (
                <div
                  id={error.id}
                  key={index}
                  className="mv-text-sm mv-font-semibold mv-text-negative-600"
                >
                  {error.message}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <input
        {...bucketInputProps}
        key={
          typeof bucketInputProps !== "undefined"
            ? bucketInputProps.key
            : undefined
        }
      />
    </div>
  );
}

FileInput.Text = FileInputText;
FileInput.Controls = FileInputControls;

export { FileInput };
