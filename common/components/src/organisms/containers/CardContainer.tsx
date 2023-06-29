import classNames from "classnames";
import React from "react";

export type CardContainerType = "single row" | "multi row";
export type CardContainerProps = {
  type?: CardContainerType;
} & React.HTMLAttributes<HTMLDivElement>;

function CardContainer(props: CardContainerProps) {
  const { type = "single row" } = props;
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  return type === "single row" ? (
    <div className="mv-flex mv-overflow-x-scroll xl:mv-overflow-x-visible mv-items-stretch">
      {validChildren.map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="mv-flex-none mv-w-3/4 sm:mv-w-1/2 lg:mv-w-1/3 xl:mv-w-1/4 mv-pb-8 first:mv-pl-4 sm:odd:mv-pl-4 mv-pr-4 lg:mv-pl-4"
          >
            {child}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="mv-flex mv-flex-wrap mv-px-4">
      {validChildren.map((child, index) => {
        const isOdd = index % 2 === 1;
        const isEven = index % 2 === 0;
        const isLeftElementIf3Items = index % 3 === 0;
        const isCenterElementIf3Items = index % 3 === 1;
        const isRightElementIf3Items = index % 3 === 2;
        const isLeftElementIf4Items = index % 4 === 0;
        const isCenterLeftElementIf4Items = index % 4 === 1;
        const isCenterRightElementIf4Items = index % 4 === 2;
        const isRightElementIf4Items = index % 4 === 3;

        const classes = classNames(
          "mv-w-full sm:mv-w-1/2 lg:mv-w-1/3 xl:mv-w-1/4 mv-pb-8",
          isEven && "sm:mv-pr-2 lg:mv-pr-0",
          isOdd && "sm:mv-pl-2 lg:mv-pl-0",
          isLeftElementIf3Items && "lg:mv-pr-6",
          isCenterElementIf3Items && "lg:mv-pl-2 lg:mv-pr-2",
          isRightElementIf3Items && "lg:mv-pl-6",
          isLeftElementIf4Items && "xl:mv-pr-4 xl:mv-pl-0",
          isCenterLeftElementIf4Items && "xl:mv-pl-4 xl:mv-pr-4",
          isCenterRightElementIf4Items && "xl:mv-pl-4 xl:mv-pr-4",
          isRightElementIf4Items && "xl:mv-pl-4 xl:mv-pr-0"
        );

        return (
          <div key={`item-${index}`} className={classes}>
            {child}
          </div>
        );
      })}
    </div>
  );
}

export default CardContainer;
