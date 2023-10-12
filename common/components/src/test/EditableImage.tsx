import React, { type ReactNode } from "react";
import Modal from "~/components/Modal/Modal";
import { type EventMode } from "~/routes/event/utils.server";
import { type OrganizationMode } from "~/routes/organization/$slug/utils.server";
import { type ProfileMode } from "~/routes/profile/$username/utils.server";
import { type ProjectMode } from "~/routes/project/utils.server";
import Image from "./Image";
import classNames from "classnames";

export type EditableImageProps = {
  mode: ProfileMode | EventMode | ProjectMode | OrganizationMode;
  editPosition?: "bottomRightCorner" | "below";
  children: ReactNode;
};

function EditableImage(props: EditableImageProps) {
  const { mode, editPosition = "bottomRightCorner" } = props;
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      const isValid = React.isValidElement(child);
      if (!isValid) {
        console.warn(
          `The child you passed to <EditableImage> is not a valid element and will be ignored: ${child}`
        );
      }
      return isValid;
    }
  );
  let images: ReactNode[] = [];
  let modals: ReactNode[] = [];
  validChildren.map((child) => {
    if ((child as React.ReactElement).type === Image) {
      images.push(child);
    } else if ((child as React.ReactElement).type === Modal) {
      modals.push(child);
    } else {
      console.warn(
        `The child you passed is not an <Image> component or a <Modal> component and will be ignored: ${child}`
      );
    }
    return null;
  });
  if (images.length === 0) {
    console.warn(
      "You should pass a <Image> component as child to the <EditableImage> component to make it look and work properly."
    );
  }
  if (images.length > 1) {
    console.warn(
      `You passed more than one <Image> component to the <EditableImage> component. Only the first <Image> component you passed will be taken for account: ${images[0]}`
    );
  }
  const image = images[0] || null;
  if (modals.length === 0) {
    console.warn(
      "You should pass a <Modal> component as child to the <EditableImage> component to make it look and work properly."
    );
  }
  if (modals.length > 1) {
    console.warn(
      `You passed more than one <Modal> component to the <EditableImage> component. Only the first <Modal> component you passed will be taken for account: ${modals[0]}`
    );
  }
  const modal = modals[0] || null;
  const modalClasses = classNames(
    editPosition === "bottomRightCorner" &&
      "mv-absolute mv-bottom-0 mv-right-0 mv-mb-4 mv-mr-4",
    editPosition === "below" &&
      "mv-relative mv-w-full mv-flex mv-justify-center mv-my-4"
  );

  return (
    <>
      {image}
      {mode === "admin" || mode === "owner" ? (
        <div className={modalClasses}>{modal}</div>
      ) : null}
    </>
  );
}

export default EditableImage;
