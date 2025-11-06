import { Children, isValidElement } from "react";
import { Link, type LinkProps } from "react-router";
import { getBasicGroupFocusStyles } from "./styleUtils";

// Design:
// Name: Breadcrump
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10671-10518&t=xdJOMkkpLkBCWx7M-4
function BreadCrump(props: { children: React.ReactNode }) {
  const { children } = props;

  const childrenArray = Children.toArray(children);

  const links = childrenArray.filter((child) => {
    return isValidElement(child) && child.type === BreadCrumpLink;
  });

  const current = childrenArray.find((child) => {
    return isValidElement(child) && child.type === BreadCrumpCurrent;
  });

  return (
    <div className="flex -my-4 xl:mt-0 xl:-mb-2 gap-2 items-center">
      <menu className="flex gap-2 items-center">
        {links.map((link) => {
          return <li key={link.toString()}>{link}</li>;
        })}
      </menu>
      {typeof current !== "undefined" ? current : null}
    </div>
  );
}

function BreadCrumpLink(props: {
  to: string;
  children: React.ReactNode;
  prefetch?: LinkProps["prefetch"];
}) {
  const { to, children, prefetch } = props;

  return (
    <Link
      to={to}
      prefetch={prefetch}
      className="flex gap-2 text-base font-normal text-neutral-700 items-center group w-fit focus:outline-none"
    >
      <span
        className={`group-hover:underline underline-offset-4 leading-[1.2rem] ${getBasicGroupFocusStyles()}`}
      >
        {children}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="7"
        height="20"
        viewBox="0 0 7 20"
        fill="none"
      >
        <path
          d="M1.42969 5C1.48587 5.00005 1.54184 5.01 1.59375 5.0293C1.64554 5.04859 1.69273 5.07675 1.73242 5.1123L6.87402 9.72754C6.91388 9.76322 6.9452 9.80588 6.9668 9.85254C6.9884 9.89926 7 9.94942 7 10C6.99999 10.0506 6.98838 10.1008 6.9668 10.1475C6.9452 10.1941 6.91383 10.2368 6.87402 10.2725L1.73242 14.8867C1.69268 14.9225 1.64571 14.9513 1.59375 14.9707C1.54184 14.99 1.48589 14.9999 1.42969 15C1.37333 15 1.3167 14.9901 1.26465 14.9707C1.21271 14.9513 1.1657 14.9225 1.12598 14.8867C1.08612 14.851 1.05479 14.8084 1.0332 14.7617C1.01165 14.715 1 14.6648 1 14.6143C1.00007 14.5639 1.01172 14.5143 1.0332 14.4678C1.05479 14.4211 1.08612 14.3785 1.12598 14.3428L5.96484 10L1.12598 5.65723C1.08614 5.62147 1.05476 5.57894 1.0332 5.53223C1.01165 5.48552 1 5.43532 1 5.38477C1.00004 5.3343 1.01168 5.28393 1.0332 5.2373C1.05476 5.19076 1.08627 5.14795 1.12598 5.1123C1.16566 5.07675 1.21287 5.0486 1.26465 5.0293C1.3167 5.00995 1.37335 5 1.42969 5Z"
          fill="currentColor"
        />
      </svg>
    </Link>
  );
}

function BreadCrumpCurrent(props: { children: React.ReactNode }) {
  return (
    <span className="text-base leading-5 text-neutral-700 font-normal">
      {props.children}
    </span>
  );
}

BreadCrump.Link = BreadCrumpLink;
BreadCrump.Current = BreadCrumpCurrent;

export default BreadCrump;
