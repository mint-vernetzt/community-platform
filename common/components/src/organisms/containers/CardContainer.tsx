import classNames from "classnames";
import { Children, isValidElement } from "react";

type CardContainerType = "single row" | "multi row";
type CardContainerProps = {
  type?: CardContainerType;
} & React.HTMLAttributes<HTMLDivElement>;

function CardContainer(props: CardContainerProps) {
  const { type = "single row" } = props;
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

  return type === "single row" ? (
    <div className="mv-flex mv-overflow-x-auto mv-items-stretch">
      {validChildren.map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="mv-flex-none mv-w-3/4 @sm:mv-w-1/2 @lg:mv-w-1/3 @xl:mv-w-1/4 mv-pb-8 mv-pt-2 first:mv-pl-4 @sm:mv-odd:mv-pl-4 mv-pr-4 @lg:mv-pl-4 "
          >
            {child}
          </div>
        );
      })}
    </div>
  ) : (
    <div className={`mv-flex mv-flex-wrap`}>
      {validChildren.map((child, index) => {
        const classes = classNames(
          "mv-w-full @sm:mv-w-1/2 @lg:mv-w-1/3 @xl:mv-w-1/4 mv-pb-8 mv-px-4"
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

export { CardContainer };
