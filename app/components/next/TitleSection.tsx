import { Children, isValidElement } from "react";
import { Link, type LinkProps } from "react-router";

// Design:
// Name: H3 Title section
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10107-9574&m=dev

function TitleSection(props: { children: React.ReactNode }) {
  const { children } = props;

  const childrenArray = Children.toArray(children);

  const headline = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Headline;
  });

  const sublines = childrenArray.filter((child) => {
    return isValidElement(child) && child.type === Subline;
  });

  return (
    <div className="flex flex-col gap-2">
      {typeof headline !== "undefined" ? headline : null}
      {sublines.length > 0 ? sublines : null}
    </div>
  );
}

function Headline(props: { children: React.ReactNode }) {
  const { children } = props;

  const helpIcon = Children.toArray(children).find((child) => {
    return isValidElement(child) && child.type === HeadlineHelpIcon;
  });

  const otherChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child) && child.type !== HeadlineHelpIcon;
  });

  return (
    <h2 className="flex gap-4 justify-between mb-0 text-primary text-2xl font-bold leading-6.5">
      <span>{otherChildren}</span>
      {typeof helpIcon !== "undefined" ? helpIcon : null}
    </h2>
  );
}

function HeadlineHelpIcon(props: { to: LinkProps["to"]; label: string }) {
  const { to, label } = props;

  return (
    <Link
      to={to}
      className="flex items-center justify-center w-4 h-4 rounded-full bg-white border border-primary text-primary"
      aria-label={label}
    >
      <svg
        width="8"
        height="12"
        viewBox="0 0 8 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.44615 3.19385C0.179634 3.19385 -0.0362058 2.97495 0.00508542 2.71634C0.263155 1.14528 1.47937 0 3.58991 0C5.70139 0 7.125 1.25611 7.125 2.96941C7.125 4.21074 6.50094 5.08263 5.4452 5.71531C4.41292 6.32397 4.11825 6.7479 4.11825 7.57176V7.59947C4.11825 7.72195 4.06882 7.83941 3.98082 7.92602C3.89282 8.01262 3.77348 8.06128 3.64903 8.06128H2.92644C2.8028 8.06128 2.68416 8.01326 2.5963 7.92765C2.50844 7.84205 2.45846 7.72577 2.45722 7.60409L2.4544 7.41937C2.41405 6.29164 2.90204 5.57122 3.99813 4.91453C4.96472 4.33081 5.30913 3.86624 5.30913 3.04145C5.30913 2.13724 4.59779 1.47316 3.5017 1.47316C2.55482 1.47316 1.89697 1.96175 1.68301 2.76806C1.62107 3.00266 1.42212 3.19385 1.17625 3.19385H0.447089H0.44615ZM3.28117 11.0833C3.86487 11.0833 4.30875 10.6455 4.30875 10.0766C4.30875 9.50581 3.86487 9.06801 3.28117 9.06801C2.71247 9.06801 2.26109 9.50581 2.26109 10.0757C2.26109 10.6455 2.71247 11.0833 3.28117 11.0833Z"
          fill="currentColor"
        />
      </svg>
    </Link>
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

Headline.HelpIcon = HeadlineHelpIcon;
TitleSection.Headline = Headline;
TitleSection.Subline = Subline;

export default TitleSection;
