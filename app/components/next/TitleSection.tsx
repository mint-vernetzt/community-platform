import { Children, isValidElement } from "react";

// Design:
// Name: H3 Title section
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10107-9574&m=dev

function TitleSection(props: { children: React.ReactNode }) {
  const { children } = props;

  const childrenArray = Children.toArray(children);

  const headline = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Headline;
  });

  const subline = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Subline;
  });

  return (
    <div className="flex flex-col gap-2">
      {typeof headline !== "undefined" ? headline : null}
      {typeof subline !== "undefined" ? subline : null}
    </div>
  );
}

function Headline(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <h2 className="mb-0 text-primary text-2xl font-bold leading-[26px]">
      {children}
    </h2>
  );
}

function Subline(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <p className="text-neutral-700 text-base font-normal leading-5">
      {children}
    </p>
  );
}

TitleSection.Headline = Headline;
TitleSection.Subline = Subline;

export default TitleSection;
