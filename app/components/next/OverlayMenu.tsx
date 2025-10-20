import {
  SquareButton,
  type SquareButtonSize,
} from "@mint-vernetzt/components/src/molecules/SquareButton";
import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useSubmit } from "react-router";

function OverlayMenu(
  props: React.PropsWithChildren & {
    searchParam: string;
    size?: SquareButtonSize;
  }
) {
  const { children, searchParam, size = "small" } = props;
  const childrenArray = Children.toArray(children);
  const listItems = childrenArray.filter(
    (child) => isValidElement(child) && child.type !== HiddenItem
  );
  const hiddenItems = childrenArray.filter(
    (child) => isValidElement(child) && child.type === HiddenItem
  );

  const submit = useSubmit();

  const [searchParams] = useSearchParams();
  const enhancedSearchParams = new URLSearchParams(searchParams.toString());
  const fallBackIsOpen =
    enhancedSearchParams.has(searchParam) &&
    enhancedSearchParams.get(searchParam) === "true";
  if (fallBackIsOpen === true) {
    enhancedSearchParams.delete(searchParam);
  } else {
    enhancedSearchParams.delete(searchParam);
    enhancedSearchParams.set(searchParam, "true");
  }

  const [isOpen, setIsOpen] = useState(fallBackIsOpen);
  const listRef = useRef<HTMLUListElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setIsOpen(fallBackIsOpen);
  }, [fallBackIsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const { target } = event;
      if (
        isOpen === true &&
        listRef.current !== null &&
        linkRef.current !== null &&
        listRef.current !== target &&
        linkRef.current !== target &&
        listRef.current.contains(target as Node) === false &&
        linkRef.current.contains(target as Node) === false
      ) {
        setIsOpen(false);
        const enhancedSearchParams = new URLSearchParams(
          searchParams.toString()
        );
        enhancedSearchParams.delete(searchParam);
        submit(enhancedSearchParams, {
          method: "get",
          replace: true,
          preventScrollReset: true,
        });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  useEffect(() => {
    if (listRef.current !== null) {
      const firstFocusableElement = listRef.current.querySelector(
        `#${getIdToFocusWhenOpening().id}`
      );
      if (
        firstFocusableElement !== null &&
        "focus" in firstFocusableElement &&
        isOpen === true
      ) {
        (firstFocusableElement as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <SquareButton
        size={size}
        variant="outline"
        as="link"
        ref={linkRef}
        to={`?${enhancedSearchParams.toString()}`}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        preventScrollReset
        replace
      >
        <svg
          width="17"
          height="16"
          viewBox="0 0 17 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.33301 9.5C2.50458 9.5 1.83301 8.82843 1.83301 8C1.83301 7.17157 2.50458 6.5 3.33301 6.5C4.16143 6.5 4.83301 7.17157 4.83301 8C4.83301 8.82843 4.16143 9.5 3.33301 9.5ZM8.33301 9.5C7.50458 9.5 6.83301 8.82843 6.83301 8C6.83301 7.17157 7.50458 6.5 8.33301 6.5C9.16144 6.5 9.83301 7.17157 9.83301 8C9.83301 8.82843 9.16144 9.5 8.33301 9.5ZM13.333 9.5C12.5046 9.5 11.833 8.82843 11.833 8C11.833 7.17157 12.5046 6.5 13.333 6.5C14.1614 6.5 14.833 7.17157 14.833 8C14.833 8.82843 14.1614 9.5 13.333 9.5Z"
            fill="#154194"
          />
        </svg>
      </SquareButton>
      {isOpen === true ? (
        <div
          className={`fixed w-screen @lg:w-fit min-w-40 h-dvh @lg:h-fit p-4 @lg:p-0 @lg:absolute top-0 ${size === "small" ? "@lg:top-10" : size === "medium" ? "@lg:top-12" : "@lg:top-14"} left-0 @lg:left-auto right-0 text-nowrap rounded-none @lg:rounded-lg shadow-none @lg:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] bg-black/50 backdrop-blur-xs @lg:bg-white flex flex-col gap-4 justify-end @lg:justify-normal z-20 @lg:z-20`}
        >
          <ul ref={listRef} className="flex flex-col bg-white rounded-lg">
            {listItems}
          </ul>
          <ul className="flex @lg:hidden flex-col bg-white rounded-lg">
            <ListItem>
              <Link
                to={`?${enhancedSearchParams.toString()}`}
                className="w-full text-center px-3 py-2 focus:outline-hidden"
                onClick={() => {
                  setIsOpen(false);
                }}
                preventScrollReset
                replace
              >
                Schließen
              </Link>
            </ListItem>
          </ul>
          {hiddenItems.length > 0 ? hiddenItems : null}
        </div>
      ) : null}
    </div>
  );
}

function ListItem(
  props: React.PropsWithChildren & {
    disabled?: boolean;
  }
) {
  const { children, disabled = false } = props;
  return (
    <li
      className={`w-full flex gap-2 items-center bg-white border-2 border-transparent text-neutral-700 first:rounded-t-lg last:rounded-b-lg${
        disabled === false
          ? " hover:bg-neutral-100 hover:border-neutral-100 active:bg-primary-50 active:border-primary-50 focus-within:bg-white focus-within:border-primary-200"
          : ""
      }`}
    >
      {children}
    </li>
  );
}

function getListItemChildrenStyles() {
  return {
    className:
      "w-full flex items-center justify-center @lg:justify-normal gap-2 appearance-none px-3 py-2 focus:outline-hidden",
  };
}

function getIdToFocusWhenOpening() {
  return {
    id: "overlay-menu-first-focusable-element",
  };
}

function Divider() {
  return <div className="w-full h-0 border-b border-neutral-200" />;
}

function HiddenItem(props: React.PropsWithChildren) {
  const { children } = props;

  return <div className="hidden">{children}</div>;
}

OverlayMenu.ListItem = ListItem;
OverlayMenu.getListChildrenStyles = getListItemChildrenStyles;
OverlayMenu.getIdToFocusWhenOpening = getIdToFocusWhenOpening;
OverlayMenu.Divider = Divider;
OverlayMenu.HiddenItem = HiddenItem;

export { OverlayMenu };
