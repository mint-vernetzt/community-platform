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

function ModalSection(props: { children: React.ReactNode }) {
  return <div className="mv-w-full mv-text-sm mv-gap-2">{props.children}</div>;
}

function ModalClose(props: { route: string }) {
  return (
    <Link
      id="modal-close-top"
      className="mv-text-primary"
      to={props.route}
      preventScrollReset
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="18"
        viewBox="0 0 19 18"
        fill="none"
      >
        <path
          d="M1.12764 0.377644C1.24705 0.257936 1.3889 0.16296 1.54507 0.0981579C1.70123 0.0333554 1.86865 0 2.03773 0C2.20681 0 2.37423 0.0333554 2.5304 0.0981579C2.68656 0.16296 2.82841 0.257936 2.94782 0.377644L9.75034 7.18273L16.5529 0.377644C16.6724 0.258129 16.8143 0.163325 16.9704 0.0986446C17.1266 0.0339638 17.2939 0.000673011 17.4629 0.000673011C17.632 0.000673011 17.7993 0.0339638 17.9555 0.0986446C18.1116 0.163325 18.2535 0.258129 18.373 0.377644C18.4925 0.497158 18.5873 0.639042 18.652 0.795195C18.7167 0.951348 18.75 1.11871 18.75 1.28773C18.75 1.45675 18.7167 1.62411 18.652 1.78027C18.5873 1.93642 18.4925 2.0783 18.373 2.19782L11.5679 9.00034L18.373 15.8029C18.4925 15.9224 18.5873 16.0643 18.652 16.2204C18.7167 16.3766 18.75 16.5439 18.75 16.7129C18.75 16.882 18.7167 17.0493 18.652 17.2055C18.5873 17.3616 18.4925 17.5035 18.373 17.623C18.2535 17.7425 18.1116 17.8373 17.9555 17.902C17.7993 17.9667 17.632 18 17.4629 18C17.2939 18 17.1266 17.9667 16.9704 17.902C16.8143 17.8373 16.6724 17.7425 16.5529 17.623L9.75034 10.8179L2.94782 17.623C2.8283 17.7425 2.68642 17.8373 2.53027 17.902C2.37411 17.9667 2.20675 18 2.03773 18C1.86871 18 1.70135 17.9667 1.5452 17.902C1.38904 17.8373 1.24716 17.7425 1.12764 17.623C1.00813 17.5035 0.913325 17.3616 0.848645 17.2055C0.783964 17.0493 0.750673 16.882 0.750673 16.7129C0.750673 16.5439 0.783964 16.3766 0.848645 16.2204C0.913325 16.0643 1.00813 15.9224 1.12764 15.8029L7.93273 9.00034L1.12764 2.19782C1.00794 2.07841 0.91296 1.93656 0.848158 1.7804C0.783355 1.62423 0.75 1.45681 0.75 1.28773C0.75 1.11865 0.783355 0.951234 0.848158 0.795067C0.91296 0.638899 1.00794 0.49705 1.12764 0.377644Z"
          fill="currentColor"
        />
      </svg>
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
    <div className="mv-transition mv-fixed mv-inset-0 mv-bg-black mv-bg-opacity-50 mv-backdrop-blur-sm mv-flex mv-items-center mv-justify-center mv-z-20 mv-px-4">
      <div
        id="modal"
        tabIndex={-1}
        className="mv-max-w-[31rem] mv-rounded-lg mv-bg-white mv-p-8 mv-flex mv-flex-col mv-gap-6"
      >
        <div className="mv-flex mv-justify-between mv-items-baseline mv-gap-4">
          {title}
          <ModalClose route={redirect ?? "."} />
        </div>
        {sections}
        {(submitButton !== null || closeButtonClone !== null) && (
          <ModalSection>
            {submitButton !== null && submitButton}
            {closeButtonClone !== null && closeButtonClone}
          </ModalSection>
        )}
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
}

Modal.Title = ModalTitle;
Modal.Section = ModalSection;
Modal.CloseButton = ModalCloseButton;
Modal.SubmitButton = ModalSubmitButton;

export { Modal };
