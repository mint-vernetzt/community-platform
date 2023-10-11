import classNames from "classnames";
import React from "react";

export type TabBarItemProps = {
  children: React.ReactNode;
  active?: boolean;
};

export function TabBarItem(props: React.PropsWithChildren<TabBarItemProps>) {
  const { active } = props;

  const children = React.Children.toArray(props.children);
  const firstNode = children[0];

  const classes = classNames(
    "mv-min-w-fit",
    "last:mv-mr-6 sm:last:mv-mr-0",
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

export type TabBarProps = {
  children: React.ReactNode;
};

function TabBar(props: TabBarProps) {
  const children = React.Children.toArray(props.children);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [showScrollLeft, setShowScrollLeft] = React.useState(false);
  const [showScrollRight, setShowScrollRight] = React.useState(false);

  const validChildren = children.filter((child) => {
    return React.isValidElement(child) && child.type === TabBarItem;
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

  const leftScrollClasses = classNames(
    "mv-transition mv-duration-200 mv-ease-in-out mv-absolute mv-left-0 mv-top-0 mv-h-16 mv-flex mv-justify-start mv-items-end",
    showScrollLeft ? "mv-opacity-100" : "mv-opacity-0 mv-pointer-events-none"
  );
  const rightScrollClasses = classNames(
    "mv-transition mv-duration-200 mv-ease-in-out mv-absolute mv-right-0 mv-top-0 mv-h-16 mv-flex mv-justify-end mv-items-end",
    showScrollRight
      ? "mv-visible mv-opacity-100"
      : "mv-invisible mv-opacity-0 mv-pointer-events-none"
  );

  return (
    <>
      <div className="mv-w-full mv-relative">
        <div
          className="mv-overflow-x-scroll"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          <ul className="mv-mb-4 mv-flex mv-justify-between mv-flex-nowrap mv-w-fit mv-gap-4 sm:mv-gap-14 mv-font-semibold">
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
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                fill="#8893A7"
                transform="rotate(180 10 10)"
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
              className="-mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                fill="#8893A7"
              />
            </svg>
          </span>
        </button>
      </div>
    </>
  );
}

export default TabBar;
