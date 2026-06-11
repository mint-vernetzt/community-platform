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
    return isValidElement(child) ? child.type !== HeadlineHelpIcon : true;
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
      className="flex items-center justify-center w-4 h-4 rounded-full bg-white border border-primary text-primary pl-px hover:bg-neutral-100 active:bg-neutral-200 focus:outline-hidden focus:border-primary-200"
      aria-label={label}
    >
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
          d="M4.40465 5.56885C4.13813 5.56885 3.92229 5.34995 3.96358 5.09134C4.22165 3.52028 5.43786 2.375 7.54841 2.375C9.65989 2.375 11.0835 3.63111 11.0835 5.34441C11.0835 6.58574 10.4594 7.45763 9.4037 8.09031C8.37142 8.69897 8.07675 9.1229 8.07675 9.94676V9.97447C8.07675 10.097 8.02731 10.2144 7.93932 10.301C7.85132 10.3876 7.73197 10.4363 7.60753 10.4363H6.88493C6.7613 10.4363 6.64266 10.3883 6.55479 10.3027C6.46693 10.217 6.41695 10.1008 6.41571 9.97909L6.4129 9.79437C6.37255 8.66664 6.86053 7.94622 7.95663 7.28953C8.92322 6.70581 9.26762 6.24124 9.26762 5.41645C9.26762 4.51224 8.55629 3.84816 7.46019 3.84816C6.51331 3.84816 5.85547 4.33675 5.64151 5.14306C5.57957 5.37766 5.38062 5.56885 5.13475 5.56885H4.40558H4.40465ZM7.23966 13.4583C7.82337 13.4583 8.26725 13.0205 8.26725 12.4516C8.26725 11.8808 7.82337 11.443 7.23966 11.443C6.67097 11.443 6.21958 11.8808 6.21958 12.4507C6.21958 13.0205 6.67097 13.4583 7.23966 13.4583Z"
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
