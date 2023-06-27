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
      {validChildren.slice(0, 4).map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="mv-flex-none mv-w-3/4 sm:mv-w-1/2 lg:mv-w-1/3 xl:mv-w-1/4 mv-pb-8 odd:mv-pl-4 mv-pr-4 lg:mv-pl-4"
          >
            {child}
          </div>
        );
      })}
    </div>
  ) : null;
}

export default CardContainer;
