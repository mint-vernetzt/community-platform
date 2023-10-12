import React, { type ReactNode } from "react";
import EditableImage from "./EditableImage";
import Status from "./Status";
import classNames from "classnames";

type HeaderProps = {
  children: ReactNode;
};

function Header(props: HeaderProps) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      const isValid = React.isValidElement(child);
      if (!isValid) {
        console.warn(
          `The child you passed to <Header> is not a valid element and will be ignored: ${child}`
        );
      }
      return isValid;
    }
  );
  let editableImages: ReactNode[] = [];
  let statuses: ReactNode[] = [];
  validChildren.map((child) => {
    if ((child as React.ReactElement).type === EditableImage) {
      editableImages.push(child);
    } else if ((child as React.ReactElement).type === Status) {
      statuses.push(child);
    } else {
      console.warn(
        `The child you passed is not an <EditableImage> component or a <Status> component and will be ignored: ${child}`
      );
    }
    return null;
  });
  if (editableImages.length === 0) {
    console.warn(
      "You should pass a <EditableImage> component as child to the <Header> component to make it look and work properly."
    );
  }
  if (editableImages.length > 1) {
    console.warn(
      `You passed more than one <EditableImage> component to the <Header> component. Only the first <EditableImage> component you passed will be taken for account: ${editableImages[0]}`
    );
  }
  const editableImage = editableImages[0] || null;
  if (statuses.length > 1) {
    console.warn(
      `You passed more than one <Status> component to the <Header> component. Only the first <Status> component you passed will be taken for account: ${statuses[0]}`
    );
  }
  const status = statuses[0] || null;

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl">
      <div className="mv-relative mv-w-full mv-h-[544px]">
        {editableImage}
        {status || null}
      </div>
    </div>
  );
}

export default Header;
