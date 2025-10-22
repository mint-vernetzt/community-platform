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
    <div className="flex overflow-x-auto gap-8">
      {validChildren.map((child) => {
        return child;
      })}
    </div>
  ) : (
    <div className="w-full @container">
      <div className="w-full grid gap-8 grid-cols-1 @cards-2:grid-cols-2 @cards-3:grid-cols-3 @cards-4:grid-cols-4 auto-rows-auto">
        {validChildren.map((child) => {
          return child;
        })}
      </div>
    </div>
  );
}

export { CardContainer };
