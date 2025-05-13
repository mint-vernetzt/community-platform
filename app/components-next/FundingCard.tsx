import { Children, isValidElement } from "react";
import { type ExploreFundingsLocales } from "~/routes/explore/fundings.server";
import { type SearchFundingsLocales } from "~/routes/search/fundings.server";

export function FundingCard(props: {
  url: string;
  children: React.ReactNode;
  locales: ExploreFundingsLocales | SearchFundingsLocales;
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
    <li
      key={props.url}
      className="mv-border mv-border-neutral-200 mv-rounded-3xl mv-px-6 mv-py-8 mv-flex mv-flex-col mv-gap-4 mv-bg-white"
    >
      {subtitle}
      {title}
      {categories}
      <FundingCard.Link to={props.url}>
        {locales.card.toFunding}
      </FundingCard.Link>
    </li>
  );
}

function FundingCardContainer(props: { children: React.ReactNode }) {
  return (
    <ul className="mv-grid mv-gap-x-6 mv-gap-y-8 mv-grid-cols-1 @lg:mv-grid-cols-2">
      {props.children}
    </ul>
  );
}

function FundingCardSubtitle(props: { children?: React.ReactNode }) {
  return typeof props.children !== "undefined" &&
    props.children !== null &&
    props.children !== "" ? (
    <span className="mv-text-neutral-700 mv-text-sm mv-font-bold">
      {props.children}
    </span>
  ) : (
    <pre> </pre>
  );
}

function FundingCardTitle(props: { children: React.ReactNode }) {
  return (
    <span className="mv-text-primary-500 @lg:mv-text-lg mv-font-bold mv-min-h-[48px] @lg:mv-min-h-[54px] mv-line-clamp-2">
      {props.children}
    </span>
  );
}

function FundingCardCategoryTitle(props: { children: React.ReactNode }) {
  return (
    <span className="mv-text-sm mv-text-neutral-700 mv-tracking-wide">
      {props.children}
    </span>
  );
}

function FundingCardLink(props: { to: string; children: React.ReactNode }) {
  return (
    <a
      href={props.to}
      className="hover:mv-underline"
      target="_blank"
      rel="noreferrer nofollow noopenner"
    >
      {" "}
      <span className="mv-flex mv-rounded-lg mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-max-w-fit mv-text-sm mv-px-4 mv-py-2 mv-gap-2 mv-items-center">
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
    </a>
  );
}

function FundingCardCategory(props: {
  children: React.ReactNode;
  items: string[];
  locales: ExploreFundingsLocales | SearchFundingsLocales;
}) {
  const { locales } = props;

  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });
  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === FundingCardCategoryTitle;
  });

  return (
    <div className="mv-flex mv-flex-col mv-text-neutral-700 mv-font-semibold mv-gap-1.5">
      {title}
      <div className="mv-min-h-[48px] @lg:mv-min-h-[54px]">
        {props.items.length > 0 ? (
          <span className="@xl:mv-text-lg mv-line-clamp-2">
            {props.items.join(", ")}
          </span>
        ) : (
          <span className="mv-text-neutral-400 mv-text-sm mv-tracking-wide">
            {locales.card.notProvided}
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
