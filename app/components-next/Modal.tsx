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
import classNames from "classnames";

function ModalSection(props: { children: React.ReactNode }) {
  return (
    <div className="w-full text-sm flex flex-col gap-4">{props.children}</div>
  );
}

function ModalClose(props: { route: string }) {
  return (
    <Link
      id="modal-close-top"
      className="text-primary"
      to={props.route}
      preventScrollReset
      aria-label="Close modal"
      prefetch="intent"
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
      className="inline-flex min-h-12 cursor-pointer select-none rounded-lg border-transparent text-center leading-4 flex-wrap items-center justify-center text-primary hover:text-primary-700 hover:bg-neutral-50 focus:text-primary-700 focus:bg-neutral-50 active:bg-neutral-100 font-semibold whitespace-nowrap w-full h-10 text-sm px-6 py-2.5 border"
      preventScrollReset
      prefetch="intent"
    >
      {props.children}
    </Link>
  );
}

function ModalSubmitButton(
  props: React.InputHTMLAttributes<HTMLButtonElement> & {
    level?: "primary" | "negative";
  }
) {
  const { children, level = "primary", ...inputProps } = props;
  const isSubmitting = useIsSubmitting();

  const classes = classNames(
    "inline-flex h-12 min-h-12 shrink-0 cursor-pointer select-none flex-wrap items-center justify-center rounded-lg border-transparent px-4 font-semibold whitespace-nowrap w-full text-sm text-center leading-[1em] py-2.5 border",
    {
      "bg-neutral-200 text-neutral-400 pointer-events-none":
        inputProps.disabled === true,
      "bg-primary text-neutral-50 hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700":
        inputProps.disabled !== true && level === "primary",
      "bg-negative-700 text-white hover:bg-negative-700 focus:bg-negative-700 active:bg-negative-700":
        inputProps.disabled !== true && level === "negative",
    }
  );

  return (
    <button
      {...inputProps}
      type="submit"
      className={classes}
      disabled={inputProps.disabled || isSubmitting}
    >
      {children}
    </button>
  );
}

function ModalTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl text-primary font-bold m-0 p-0">
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
        className="relative max-w-[31rem] rounded-2xl bg-white p-6 flex flex-col gap-6"
      >
        <div className="flex justify-between items-baseline gap-4">
          {title}
          <ModalClose route={redirect ?? "."} />
        </div>
        {sections}
        {(submitButton !== null || closeButtonClone !== null) && (
          <div className="w-full text-sm leading-1 flex flex-col gap-2">
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
