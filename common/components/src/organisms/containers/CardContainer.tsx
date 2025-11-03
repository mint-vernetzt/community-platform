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
    <div className="w-full flex overflow-x-auto @container items-stretch">
      {validChildren.map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="flex-none w-3/4 @cards-2:w-1/2 @cards-3:w-1/3 @cards-4:w-1/4 first:pr-4 first:px-0 px-4 last:px-0 last:pl-4 only:pl-0 only:pr-4 pb-8 pt-2"
          >
            {child}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="w-full @container">
      <div className="w-full grid gap-8 grid-cols-1 @cards-2:grid-cols-2 @cards-3:grid-cols-3 @cards-4:grid-cols-4 auto-rows-auto items-stretch">
        {validChildren.map((child) => {
          return child;
        })}
      </div>
    </div>
  );
}

export { CardContainer };
