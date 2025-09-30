import { Children, createContext, isValidElement, useContext } from "react";
import { Link } from "react-router";
import { Heading } from "~/components/legacy/Heading/Heading";
import { type ExploreFundingsLocales } from "~/routes/explore/fundings.server";

const FundingCardContext = createContext<{
  locales: ExploreFundingsLocales;
} | null>(null);

function useFundingCardContext() {
  const context = useContext(FundingCardContext);
  if (context === null) {
    throw new Error("Missing FundingCardContext.Provider");
  }
  return context;
}

export function FundingCard(props: {
  url: string;
  children: React.ReactNode;
  locales: ExploreFundingsLocales;
}) {
  const { locales } = props;
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

  const subtitle = validChildren.find((child) => {
    return (child as React.ReactElement).type === FundingCardSubtitle;
  });
  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === FundingCardTitle;
  });
  const categories = validChildren.filter((child) => {
    return (child as React.ReactElement).type === FundingCardCategory;
  });

  return (
    <FundingCardContext.Provider value={{ locales }}>
      <li
        key={props.url}
        className="border border-neutral-200 rounded-3xl px-6 py-8 flex flex-col gap-4 bg-white"
      >
        {subtitle}
        {title}
        {categories}
        <FundingCard.Link to={props.url}>
          {locales.card.toFunding}
        </FundingCard.Link>
      </li>
    </FundingCardContext.Provider>
  );
}

function FundingCardContainer(props: { children: React.ReactNode }) {
  return (
    <ul className="grid gap-x-6 gap-y-8 grid-cols-1 @lg:grid-cols-2">
      {props.children}
    </ul>
  );
}

function FundingCardSubtitle(props: { children?: React.ReactNode }) {
  const { locales } = useFundingCardContext();

  return (
    <span className="text-neutral-700 text-sm font-bold">
      {typeof props.children !== "undefined" &&
      props.children !== null &&
      props.children !== "" &&
      props.children !== "ohne Kategorie"
        ? props.children
        : locales.card.noFundingType}
    </span>
  );
}

function FundingCardTitle(props: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  const { children, as = "h4" } = props;
  return (
    <Heading
      as={as}
      className="text-primary-500 @lg:text-lg font-bold min-h-[48px] @lg:min-h-[50px] line-clamp-2"
    >
      {children}
    </Heading>
  );
}

function FundingCardCategoryTitle(props: { children: React.ReactNode }) {
  return (
    <span className="text-sm text-neutral-700 tracking-wide">
      {props.children}
    </span>
  );
}

function FundingCardLink(props: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={props.to}
      className="hover:underline w-fit rounded-lg"
      target="_blank"
      rel="noreferrer nofollow noopenner"
    >
      {" "}
      <span className="flex rounded-lg bg-primary text-neutral-50 hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700 max-w-fit text-sm px-4 py-2 gap-2 items-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.63636 3.5C8.63636 3.22386 8.41251 3 8.13636 3H1.5C0.671572 3 0 3.67157 0 4.5V14.5C0 15.3284 0.671573 16 1.5 16H11.5C12.3284 16 13 15.3284 13 14.5V7.86364C13 7.58749 12.7761 7.36364 12.5 7.36364C12.2239 7.36364 12 7.58749 12 7.86364V14.5C12 14.7761 11.7761 15 11.5 15H1.5C1.22386 15 1 14.7761 1 14.5V4.5C1 4.22386 1.22386 4 1.5 4H8.13636C8.41251 4 8.63636 3.77614 8.63636 3.5Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 0.5C16 0.223858 15.7761 0 15.5 0H10.5C10.2239 0 10 0.223858 10 0.5C10 0.776142 10.2239 1 10.5 1H14.2929L6.14645 9.14645C5.95118 9.34171 5.95118 9.65829 6.14645 9.85355C6.34171 10.0488 6.65829 10.0488 6.85355 9.85355L15 1.70711V5.5C15 5.77614 15.2239 6 15.5 6C15.7761 6 16 5.77614 16 5.5V0.5Z"
            fill="currentColor"
          />
        </svg>
        {props.children}
      </span>
    </Link>
  );
}

function FundingCardCategory(props: {
  children: React.ReactNode;
  items: string[];
  locales: ExploreFundingsLocales;
}) {
  const { locales } = props;

  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });
  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === FundingCardCategoryTitle;
  });

  return (
    <div className="flex flex-col text-neutral-700 font-semibold gap-1.5">
      {title}
      <div className="min-h-[48px] @lg:min-h-[54px]">
        {props.items.length === 0 ||
        (props.items.length === 1 && props.items[0] === "ohne Kategorie") ? (
          <span className="text-neutral-400 text-sm tracking-wide">
            {locales.card.notProvided}
          </span>
        ) : (
          <span className="@xl:text-lg line-clamp-2">
            {props.items.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}

FundingCardCategory.Title = FundingCardCategoryTitle;
FundingCard.Category = FundingCardCategory;
FundingCard.Link = FundingCardLink;
FundingCard.Title = FundingCardTitle;
FundingCard.Subtitle = FundingCardSubtitle;
FundingCard.Container = FundingCardContainer;
