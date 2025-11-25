import classNames from "classnames";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Design:
// Name: Tabbar_desktop and Tabbar_mobile
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10019-4739&t=RCfMh8dO7bplY9UJ-4
const TabBarItemContext = createContext<{ active: boolean }>({ active: false });

function useTabBarItemContext() {
  const context = useContext(TabBarItemContext);
  if (typeof context === "undefined") {
    throw new Error("TabBar.Item must be used within a TabBar");
  }
  return context;
}

function Counter(props: React.PropsWithChildren<{ active?: boolean }>) {
  const { active } = useTabBarItemContext();
  return (
    <span
      className={classNames(
        "text-xs font-semibold leading-4 grid grid-cols-1 grid-rows-1 place-items-center h-4 min-w-6 py-0.5 px-1.5 rounded-lg",
        active
          ? "text-primary bg-primary-50"
          : "text-neutral-600 bg-neutral-200"
      )}
    >
      {props.children}
    </span>
  );
}

function Title(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;
  const { active } = useTabBarItemContext();
  return (
    <h2
      className={classNames("text-lg font-semibold text-neutral mb-0", {
        "text-primary": active,
      })}
      {...otherProps}
    >
      {children}
    </h2>
  );
}

function getItemElementClasses(active: boolean) {
  return {
    className: classNames("mb-3", "p-2", "flex gap-2 items-center", {
      "hover:bg-neutral-100 hover:rounded-lg text-neutral-500 hover:text-neutral-600":
        active === false,
    }),
  };
}

function Item(props: { children: React.ReactNode; active?: boolean }) {
  const { active = false } = props;

  return (
    <TabBarItemContext value={{ active }}>
      <li
        className={classNames(
          "h-fit",
          "min-w-fit",
          "relative",
          "last:mr-6",
          "md:last:mr-0",
          { "text-primary": active }
        )}
      >
        {props.children}
        {active ? (
          <div className="absolute bottom-0 w-full h-1 rounded-t-lg bg-primary" />
        ) : null}
      </li>
    </TabBarItemContext>
  );
}

Item.Title = Title;
Item.Counter = Counter;

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
    "transition duration-200 ease-in-out absolute top-1 h-16 flex items-end text-gray-400"
  );

  const leftScrollClasses = classNames(
    scrollClasses,
    "left-0 justify-start",
    showScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
  );
  const rightScrollClasses = classNames(
    scrollClasses,
    "right-0 justify-end",
    showScrollRight
      ? "visible opacity-100"
      : "invisible opacity-0 pointer-events-none"
  );

  return (
    <>
      <div className="w-full relative">
        <div
          className="overflow-x-auto"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          <ul className="w-full border-b border-neutral-200 flex flex-nowrap gap-8 @sm:gap-14 font-semibold">
            {validChildren}
          </ul>
        </div>
        <button
          className={leftScrollClasses}
          onClick={handleLeftClick}
          disabled={!showScrollLeft}
        >
          <span className="bg-white h-full flex items-center">
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
          <span className="h-full w-5 bg-gradient-to-r from-white" />
        </button>
        <button
          className={rightScrollClasses}
          onClick={handleRightClick}
          disabled={!showScrollRight}
        >
          <span className="h-full w-5 bg-gradient-to-l from-white" />
          <span className="bg-white h-full flex items-center">
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
TabBar.getItemElementClasses = getItemElementClasses;

export default TabBar;
