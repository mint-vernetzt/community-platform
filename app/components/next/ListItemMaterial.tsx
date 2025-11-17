import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import classNames from "classnames";
import { Children, createContext, isValidElement, useContext } from "react";
import { useListContext } from "./List";
import { FileTypePDFIcon } from "./icons/FileTypePDFIcon";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { type LinkProps } from "react-router";

// Design:
// Name: List item (Material)
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=8295-102063&t=RJvvlCKHSMjVtZMO-4
const ListItemMaterialContext = createContext<{ type?: "image" | "pdf" }>({});

export function useListItemMaterialContext() {
  const context = useContext(ListItemMaterialContext);
  if (context === null) {
    throw new Error(
      "useListItemMaterialContext must be used within a ListItemMaterialContext"
    );
  }
  return context;
}

function ListItemMaterial(props: {
  children: React.ReactNode;
  index: number;
  type: "image" | "pdf";
}) {
  const { children, index, type } = props;
  const { hideAfter } = useListContext();

  const hideClasses = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:block"
      : "block"
  );

  const classes = classNames(
    "flex gap-4 items-center border border-neutral-200 rounded-lg h-24",
    type === "pdf" && "pl-4 sm:pl-0"
  );

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  const image = validChildren.find((child) => {
    return isValidElement(child) && child.type === Image && type !== "pdf";
  });

  const imageClasses = classNames(
    "h-[94px] w-36 min-w-36 rounded-l-[7px] overflow-hidden",
    type === "pdf" &&
      "hidden sm:flex bg-primary-100 items-center justify-center"
  );
  const headline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemMaterial.Headline;
  });
  const headlineSuffix = validChildren.find((child) => {
    return (
      isValidElement(child) && child.type === ListItemMaterial.HeadlineSuffix
    );
  });
  const subline = validChildren.find((child) => {
    return (
      isValidElement(child) &&
      child.type === ListItemMaterial.Subline &&
      type !== "pdf"
    );
  });
  const controls = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemMaterial.Controls;
  });

  return (
    <ListItemMaterialContext value={{ type: type }}>
      <li className={hideClasses}>
        <div className={classes}>
          <div className={imageClasses}>
            {type === "image" ? image : <FileTypePDFIcon />}
          </div>
          <div className="flex flex-col grow">
            <div className="flex flex-col sm:flex-row sm:gap-1">
              {headline}
              {headlineSuffix}
            </div>
            {subline}
          </div>
          {controls}
        </div>
      </li>
    </ListItemMaterialContext>
  );
}

function ListItemHeadline(props: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-700 text-base font-bold leading-5 line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemHeadlineSuffix(props: { children: React.ReactNode }) {
  const { type } = useListItemMaterialContext();

  const classes = classNames(
    "text-neutral-700 text-base font-normal leading-5 text-nowrap",
    type === "image" && "hidden sm:block"
  );
  return <div className={classes}>{props.children}</div>;
}

function ListItemSubline(props: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-600 text-sm font-normal leading-normal line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemControls(props: { children: React.ReactNode }) {
  return <div className="flex gap-4 pr-4">{props.children}</div>;
}

function ListItemControlsDownload(
  props: { label: string } & LinkProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const { label, ...linkProps } = props;
  return (
    <CircleButton
      as={"link"}
      aria-label={label}
      reloadDocument
      variant="ghost"
      {...linkProps}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M0.625 12.375C0.970178 12.375 1.25 12.6549 1.25 13V16.125C1.25 16.8154 1.80964 17.375 2.5 17.375H17.5C18.1904 17.375 18.75 16.8154 18.75 16.125V13C18.75 12.6549 19.0298 12.375 19.375 12.375C19.7202 12.375 20 12.6549 20 13V16.125C20 17.5057 18.8807 18.625 17.5 18.625H2.5C1.11929 18.625 0 17.5057 0 16.125V13C0 12.6549 0.279822 12.375 0.625 12.375Z"
          fill="currentColor"
        />
        <path
          d="M9.55806 14.8169C9.80214 15.061 10.1979 15.061 10.4419 14.8169L14.1919 11.0669C14.436 10.8229 14.436 10.4271 14.1919 10.1831C13.9479 9.93898 13.5521 9.93898 13.3081 10.1831L10.625 12.8661V1.875C10.625 1.52982 10.3452 1.25 10 1.25C9.65482 1.25 9.375 1.52982 9.375 1.875V12.8661L6.69194 10.1831C6.44786 9.93898 6.05214 9.93898 5.80806 10.1831C5.56398 10.4271 5.56398 10.8229 5.80806 11.0669L9.55806 14.8169Z"
          fill="currentColor"
        />
      </svg>
    </CircleButton>
  );
}

ListItemMaterial.Subline = ListItemSubline;
ListItemMaterial.Headline = ListItemHeadline;
ListItemMaterial.HeadlineSuffix = ListItemHeadlineSuffix;
ListItemMaterial.Image = Image;
ListItemMaterial.Controls = ListItemControls;
ListItemControls.Download = ListItemControlsDownload;

export default ListItemMaterial;
