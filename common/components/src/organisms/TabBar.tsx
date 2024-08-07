import classNames from "classnames";
import React from "react";

export type TabBarItemProps = {
  children: React.ReactNode;
  active?: boolean;
};

function Item(props: React.PropsWithChildren<TabBarItemProps>) {
  const { active } = props;

  const children = React.Children.toArray(props.children);
  const firstNode = children[0];

  const classes = classNames(
    "mv-min-w-fit",
    "last:mv-mr-6 @sm:mv-last:mv-mr-0",
    active
      ? "mv-text-primary mv-border-b-2 mv-border-b-primary"
      : "mv-text-gray-400"
  );

  // if first node is a string, wrap string into span
  if (typeof firstNode === "string") {
    return (
      <li className={classes}>
        <span className="mv-pt-6 mv-pb-1 mv-block">{firstNode}</span>
      </li>
    );
  }

  // if first node is a valid react element, get first child and wrap it into span
  if (React.isValidElement(firstNode)) {
    const clone = React.cloneElement(firstNode as React.ReactElement);
    const cloneChildren = React.Children.toArray(clone.props.children);

    if (cloneChildren.length > 0) {
      const firstChild = cloneChildren[0];
      const wrappedFirstChild = (
        <span className="mv-pt-6 mv-pb-1 mv-block">{firstChild}</span>
      );
      return (
        <li className={classes}>
          {React.cloneElement(firstNode, {}, wrappedFirstChild)}
        </li>
      );
    }
  }

  return null;
}

export const TabBarItem = Item;

export type TabBarProps = {
  children: React.ReactNode;
};

function TabBar(props: TabBarProps) {
  const children = React.Children.toArray(props.children);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [showScrollLeft, setShowScrollLeft] = React.useState(false);
  const [showScrollRight, setShowScrollRight] = React.useState(false);

  const validChildren = children.filter((child) => {
    return React.isValidElement(child) && child.type === Item;
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
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      if (
        scrollContainerRef.current.scrollWidth >
        scrollContainerRef.current.clientWidth
      ) {
        setShowScrollRight(true);
      }
    }
  }, []);

  // check if scroll container is scrollable on resize
  React.useEffect(() => {
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
          <ul className="mv-mb-4 mv-flex mv-justify-between mv-flex-nowrap mv-w-fit mv-gap-4 @sm:mv-gap-14 mv-font-semibold">
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
              className="-mr-2"
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

export default TabBar;
