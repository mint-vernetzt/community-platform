import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import classNames from "classnames";
import { Children, createContext, isValidElement, useContext } from "react";
import { useListContext } from "./List";
import { FileTypePDFIcon } from "./icons/FileTypePDFIcon";

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

  const classes = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:flex"
      : "flex",
    "gap-4 items-center border border-neutral-200 rounded-lg h-24",
    type === "pdf" && "pl-4 sm:pl-0"
  );

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  const image = validChildren.find((child) => {
    return isValidElement(child) && child.type === Image;
  });
  if (type === "pdf" && typeof image !== "undefined") {
    throw new Error("ListItemMaterial.Image is not allowed for type PDF");
  }
  const imageClasses = classNames(
    "h-24 w-36 rounded-l-lg overflow-hidden",
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
    return isValidElement(child) && child.type === ListItemMaterial.Subline;
  });
  const controls = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemMaterial.Controls;
  });

  return (
    <ListItemMaterialContext value={{ type: type }}>
      <li>
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
    "text-neutral-700 text-base font-normal leading-5 line-clamp-1",
    type === "image" && "hidden sm:block"
  );
  return <div className={classes}>{props.children}</div>;
}

function ListItemSubline(props: { children: React.ReactNode }) {
  const { type } = useListItemMaterialContext();
  if (type === "pdf") {
    throw new Error("ListItemMaterial.Subline is not allowed for type PDF");
  }
  return (
    <div className="text-neutral-600 text-sm font-normal leading-normal line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemControls(props: { children: React.ReactNode }) {
  return <div className="flex gap-4 pr-4">{props.children}</div>;
}

ListItemMaterial.Subline = ListItemSubline;
ListItemMaterial.Headline = ListItemHeadline;
ListItemMaterial.HeadlineSuffix = ListItemHeadlineSuffix;
ListItemMaterial.Image = Image;
ListItemMaterial.Controls = ListItemControls;

export default ListItemMaterial;
