import { Link, useSearchParams } from "react-router";
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

function ModalSection(props: { children: React.ReactNode }) {
  return (
    <div className="mv-w-full mv-text-sm mv-leading-1 mv-flex mv-flex-col mv-gap-4">
      {props.children}
    </div>
  );
}

function ModalClose(props: { route: string }) {
  return (
    <Link
      id="modal-close-top"
      className="mv-text-primary"
      to={props.route}
      preventScrollReset
      aria-label="Close modal"
    >
      <ModalCloseIcon />
    </Link>
  );
}

type ModalCloseButtonProps = React.PropsWithChildren<{ route?: string }> &
  React.InputHTMLAttributes<HTMLAnchorElement>;

function ModalCloseButton(props: ModalCloseButtonProps) {
  const { route, children, ...anchorProps } = props;
  if (typeof route === "undefined") {
    return <>{children}</>;
  }

  return (
    <Link
      {...anchorProps}
      id="modal-close-bottom"
      to={route}
      className="mv-inline-flex mv-min-h-12 mv-cursor-pointer mv-select-none mv-rounded-lg mv-border-transparent mv-text-center mv-leading-4 mv-flex-wrap mv-items-center mv-justify-center mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-font-semibold mv-whitespace-nowrap mv-w-full mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border"
      preventScrollReset
    >
      {props.children}
    </Link>
  );
}

function ModalSubmitButton(
  props: React.InputHTMLAttributes<HTMLButtonElement>
) {
  const { children, ...inputProps } = props;
  const isSubmitting = useIsSubmitting();
  return (
    <button
      {...inputProps}
      type="submit"
      className={`mv-inline-flex mv-h-12 mv-min-h-12 mv-shrink-0 mv-cursor-pointer mv-select-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-border-transparent mv-px-4 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-font-semibold mv-whitespace-nowrap mv-w-full mv-text-sm mv-text-center mv-leading-[1em] mv-py-2.5 mv-border ${
        inputProps.disabled === true
          ? "mv-bg-neutral-200 mv-text-neutral-400 mv-pointer-events-none"
          : "mv-bg-primary mv-text-neutral-50"
      }`}
      disabled={inputProps.disabled || isSubmitting}
    >
      {children}
    </button>
  );
}

function ModalTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="mv-text-3xl mv-text-primary mv-font-bold mv-m-0 mv-p-0">
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
    <div className="mv-transition mv-fixed mv-inset-0 mv-bg-black mv-bg-opacity-50 mv-backdrop-blur-sm mv-flex mv-flex-col mv-gap-10 mv-items-center mv-justify-center mv-z-30 mv-px-4">
      <div
        id="modal"
        tabIndex={-1}
        className="mv-relative mv-max-w-[31rem] mv-rounded-2xl mv-bg-white mv-p-6 mv-flex mv-flex-col mv-gap-6"
      >
        <div className="mv-flex mv-justify-between mv-items-baseline mv-gap-4">
          {title}
          <ModalClose route={redirect ?? "."} />
        </div>
        {sections}
        {(submitButton !== null || closeButtonClone !== null) && (
          <div className="mv-w-full mv-text-sm mv-leading-1 mv-flex mv-flex-col mv-gap-2">
            {submitButton !== null && submitButton}
            {closeButtonClone !== null && closeButtonClone}
          </div>
        )}
        <div className="mv-absolute -mv-bottom-20 mv-left-0 mv-w-full">
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
