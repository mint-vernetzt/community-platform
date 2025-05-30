import classNames from "classnames";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

function Counter(props: React.PropsWithChildren<{ active?: boolean }>) {
  const { active } = props;
  return (
    <span
      className={`mv-text-xs mv-font-semibold mv-leading-4 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-fit mv-py-0.5 mv-px-2.5 mv-rounded-lg${
        active
          ? " mv-text-primary mv-bg-primary-50"
          : " mv-text-neutral-600 mv-bg-neutral-200"
      }`}
    >
      {props.children}
    </span>
  );
}

type TabBarItemProps = {
  children: React.ReactNode;
  active?: boolean;
};

function Item(props: React.PropsWithChildren<TabBarItemProps>) {
  const { active } = props;

  const children = Children.toArray(props.children);
  const firstNode = children[0];

  const listItemClasses = classNames(
    "mv-h-fit",
    "mv-min-w-fit",
    "mv-relative",
    "last:mv-mr-6 @sm:mv-last:mv-mr-0",
    active && "mv-text-primary"
  );

  const spanClasses = classNames(
    "mv-mb-3 mv-p-2 mv-block",
    !active &&
      "hover:mv-bg-neutral-100 hover:mv-rounded-lg mv-text-neutral-500 hover:mv-text-neutral-600"
  );

  // if first node is a string, wrap string into span
  if (typeof firstNode === "string") {
    return (
      <li className={listItemClasses}>
        <span className={spanClasses}>{firstNode}</span>
        {active ? (
          <div className="mv-absolute mv-bottom-0 mv-w-full mv-h-1 mv-rounded-t-lg mv-bg-primary" />
        ) : null}
      </li>
    );
  }

  // if first node is a valid react element, get first child and wrap it into span
  if (isValidElement(firstNode)) {
    const clone = cloneElement(firstNode as React.ReactElement);
    const cloneChildren =
      typeof clone.props === "object" &&
      clone.props !== null &&
      "children" in clone.props
        ? Children.toArray(clone.props.children as React.ReactNode)
        : [];

    if (cloneChildren.length > 0) {
      const firstChild = cloneChildren[0];
      const wrappedFirstChild = (
        <span className={spanClasses}>{firstChild}</span>
      );
      return (
        <li className={listItemClasses}>
          {cloneElement(firstNode, {}, wrappedFirstChild)}
          {active ? (
            <div className="mv-absolute mv-bottom-0 mv-w-full mv-h-1 mv-rounded-t-lg mv-bg-primary" />
          ) : null}
        </li>
      );
    }
  }

  return null;
}

type TabBarProps = {
  children: React.ReactNode;
};

function TabBar(props: TabBarProps) {
  const children = Children.toArray(props.children);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const validChildren = children.filter((child) => {
    return isValidElement(child) && child.type === Item;
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollLeft > 0) {
      setShowScrollLeft(true);
    } else {
      setShowScrollLeft(false);
    }
    if (
      event.currentTarget.scrollWidth -
        event.currentTarget.clientWidth -
        event.currentTarget.scrollLeft <
      20
    ) {
      setShowScrollRight(false);
    } else {
      setShowScrollRight(true);
    }
  };

  const handleLeftClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= 40;
    }
  };

  const handleRightClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += 40;
    }
  };

  // check if scroll container is scrollable on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (
        scrollContainerRef.current.scrollWidth >
        scrollContainerRef.current.clientWidth
      ) {
        setShowScrollRight(true);
        setShowScrollLeft(false);
      } else {
        setShowScrollRight(false);
        setShowScrollLeft(false);
      }
    }
  }, []);

  // check if scroll container is scrollable on resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        if (
          scrollContainerRef.current.scrollWidth >
          scrollContainerRef.current.clientWidth
        ) {
          setShowScrollRight(true);
        } else {
          setShowScrollRight(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const scrollClasses = classNames(
    "mv-transition mv-duration-200 mv-ease-in-out mv-absolute mv-top-1 mv-h-16 mv-flex mv-items-end mv-text-gray-400"
  );

  const leftScrollClasses = classNames(
    scrollClasses,
    "mv-left-0 mv-justify-start",
    showScrollLeft ? "mv-opacity-100" : "mv-opacity-0 mv-pointer-events-none"
  );
  const rightScrollClasses = classNames(
    scrollClasses,
    "mv-right-0 mv-justify-end",
    showScrollRight
      ? "mv-visible mv-opacity-100"
      : "mv-invisible mv-opacity-0 mv-pointer-events-none"
  );

  return (
    <>
      <div className="mv-w-full mv-relative">
        <div
          className="mv-overflow-x-auto"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          <ul className="mv-w-full mv-border-b mv-border-neutral-200 mv-flex mv-flex-nowrap mv-gap-8 @sm:mv-gap-14 mv-font-semibold">
            {validChildren}
          </ul>
        </div>
        <button
          className={leftScrollClasses}
          onClick={handleLeftClick}
          disabled={!showScrollLeft}
        >
          <span className="mv-bg-white mv-h-full mv-flex mv-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </span>
          <span className="mv-h-full mv-w-5 mv-bg-gradient-to-r mv-from-white" />
        </button>
        <button
          className={rightScrollClasses}
          onClick={handleRightClick}
          disabled={!showScrollRight}
        >
          <span className="mv-h-full mv-w-5 mv-bg-gradient-to-l mv-from-white" />
          <span className="mv-bg-white mv-h-full mv-flex mv-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="mv--mr-2"
            >
              <path
                fillRule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </span>
        </button>
      </div>
    </>
  );
}

TabBar.Item = Item;
TabBar.Counter = Counter;

export { TabBar };
