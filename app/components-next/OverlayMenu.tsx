import { SquareButton } from "@mint-vernetzt/components/src/molecules/SquareButton";
import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { useSearchParams, type LinkProps } from "react-router";

function OverlayMenu(
  props: React.PropsWithChildren &
    Omit<LinkProps, "to"> &
    React.RefAttributes<HTMLAnchorElement> & {
      searchParam: string;
    }
) {
  const { children, searchParam, ...linkProps } = props;
  const childrenArray = Children.toArray(children);
  const listItems = childrenArray.filter(
    (child) =>
      isValidElement(child) &&
      (child.type === ListItem || child.type === Divider)
  );

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
    const handleClickOutside = (event: MouseEvent) => {
      const { target } = event;
      if (
        listRef.current !== null &&
        linkRef.current !== null &&
        linkRef.current.contains(target as Node) === false &&
        target !== linkRef.current &&
        listRef.current.contains(target as Node) === false &&
        target !== listRef.current
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="mv-relative">
      <SquareButton
        size="small"
        variant="outline"
        as="link"
        ref={linkRef}
        to={`?${enhancedSearchParams.toString()}`}
        {...linkProps}
        onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          event.preventDefault();
          if (typeof linkProps.onClick !== "undefined") {
            linkProps.onClick(event);
          }
          setIsOpen((prev) => !prev);
        }}
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
        <ul
          ref={listRef}
          className="mv-absolute mv-top-10 mv-right-0 mv-text-nowrap mv-rounded-lg mv-shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] mv-bg-white mv-flex mv-flex-col mv-z-10 mv-overflow-hidden"
        >
          {listItems}
        </ul>
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
      className={`mv-w-full mv-flex mv-gap-2 mv-items-center mv-bg-white mv-border-2 mv-border-transparent mv-text-neutral-700 first:mv-rounded-t-lg last:mv-rounded-b-lg${
        disabled === false
          ? " hover:mv-bg-neutral-100 hover:mv-border-neutral-100 active:mv-bg-primary-50 active:mv-border-primary-50 focus-within:mv-bg-white focus-within:mv-border-primary-200"
          : ""
      }`}
    >
      {children}
    </li>
  );
}

function Divider() {
  return <div className="mv-w-full mv-h-0 mv-border-b mv-border-neutral-200" />;
}

OverlayMenu.ListItem = ListItem;
OverlayMenu.Divider = Divider;

export { OverlayMenu };
