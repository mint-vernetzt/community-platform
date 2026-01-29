import { type LinkProps, useSearchParams } from "react-router";
import { createPortal } from "react-dom";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { ModalClose as ModalCloseIcon } from "./icons/ModalClose";
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";

function ModalSection(props: { children: React.ReactNode }) {
  return (
    <div className="w-full text-sm flex flex-col gap-4">{props.children}</div>
  );
}

function ModalClose(props: { route: string }) {
  return (
    <CircleButton
      as="link"
      variant="ghost"
      size="small"
      id="modal-close-top"
      to={props.route}
      preventScrollReset
      aria-label="Close modal"
      prefetch="intent"
    >
      <ModalCloseIcon />
    </CircleButton>
  );
}

type ModalCloseButtonProps = React.PropsWithChildren<{
  route?: string;
  as?: "button" | "link";
}> &
  Omit<LinkProps & React.RefAttributes<HTMLAnchorElement>, "to"> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

function ModalCloseButton(props: ModalCloseButtonProps) {
  const { route, children, as = "link", ...anchorOrButtonProps } = props;
  if (typeof route === "undefined") {
    return <>{children}</>;
  }

  return as === "link" ? (
    <Button
      as="link"
      variant="outline"
      id="modal-close-bottom"
      preventScrollReset
      prefetch="intent"
      fullSize
      to={route}
      {...anchorOrButtonProps}
    >
      {props.children}
    </Button>
  ) : (
    <Button
      type="submit"
      variant="outline"
      id="modal-close-bottom"
      fullSize
      {...anchorOrButtonProps}
    >
      {props.children}
    </Button>
  );
}

function ModalSubmitButton(
  props: {
    level?: "primary" | "negative";
    as?: "button" | "link";
  } & (
    | (LinkProps & React.RefAttributes<HTMLAnchorElement>)
    | React.ButtonHTMLAttributes<HTMLButtonElement>
  )
) {
  const {
    children,
    level = "primary",
    as = "button",
    ...anchorOrButtonProps
  } = props;
  const isSubmitting = useIsSubmitting();

  return as === "button" && "to" in anchorOrButtonProps === false ? (
    <Button
      type="submit"
      level={level}
      disabled={anchorOrButtonProps.disabled || isSubmitting}
      fullSize
      {...anchorOrButtonProps}
    >
      {children}
    </Button>
  ) : (
    <Button
      as="link"
      level={level}
      fullSize
      preventScrollReset
      prefetch="intent"
      {...anchorOrButtonProps}
    >
      {children}
    </Button>
  );
}

function ModalTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl text-primary font-bold m-0 leading-6.5">
      {props.children}
    </h2>
  );
}

function useRedirect(props: { searchParam: string }) {
  const [searchParams] = useSearchParams();
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const searchParamsCopy = new URLSearchParams(searchParams.toString());
    searchParamsCopy.delete(props.searchParam);
    const params = searchParamsCopy.toString();
    let path = location.pathname;
    if (params) {
      path = `${path}?${params}`;
    }
    setRedirect(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return redirect;
}

function Modal(props: React.PropsWithChildren<{ searchParam: string }>) {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const redirect = useRedirect({ searchParam: props.searchParam });

  useEffect(() => {
    if (typeof document !== "undefined") {
      setOpen(searchParams.get(props.searchParam) === "true");
    }
  }, [props.searchParam, searchParams]);

  useEffect(() => {
    if (open) {
      // const modalCloseTop = document.getElementById("modal-close-top");
      // modalCloseTop?.focus();

      const modal = document.getElementById("modal");
      modal?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const children = Children.toArray(props.children);
  const title = children.find((child) => {
    return isValidElement(child) && child.type === ModalTitle;
  });
  const sections = children.filter((child) => {
    return isValidElement(child) && child.type === ModalSection;
  });
  const submitButton = children.find((child) => {
    return isValidElement(child) && child.type === ModalSubmitButton;
  });
  const closeButton = children.find((child) => {
    return isValidElement(child) && child.type === ModalCloseButton;
  });
  const alert = children.find((child) => {
    return isValidElement(child) && child.type === Alert;
  });

  if (closeButton === null) {
    throw new Error("Modal requires a close button");
  }

  const closeButtonClone =
    typeof closeButton !== "undefined"
      ? cloneElement<ModalCloseButtonProps>(
          closeButton as React.ReactElement<ModalCloseButtonProps>,
          {
            route: redirect || undefined,
          }
        )
      : null;

  return createPortal(
    <div className="transition fixed inset-0 bg-black/50 backdrop-blur-xs flex flex-col gap-10 items-center justify-center z-30 px-4">
      <div
        id="modal"
        tabIndex={-1}
        className="relative max-w-124 rounded-lg bg-white p-6 flex flex-col gap-6"
      >
        <div className="flex justify-between items-baseline gap-4">
          {title}
          <ModalClose route={redirect ?? "."} />
        </div>
        {sections}
        {(submitButton !== null || closeButtonClone !== null) && (
          <div className="w-full flex flex-col gap-2">
            {submitButton !== null && submitButton}
            {closeButtonClone !== null && closeButtonClone}
          </div>
        )}
        <div className="absolute -bottom-20 left-0 w-full">
          {alert !== null ? alert : null}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
}

Modal.Title = ModalTitle;
Modal.Section = ModalSection;
Modal.CloseButton = ModalCloseButton;
Modal.SubmitButton = ModalSubmitButton;
Modal.Alert = Alert;

export { Modal };
