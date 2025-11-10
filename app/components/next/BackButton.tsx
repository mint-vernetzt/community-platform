import { Link, type LinkProps } from "react-router";
import { getBasicGroupFocusStyles } from "./styleUtils";

// Design:
// Name: Back button
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10671-10532&t=xdJOMkkpLkBCWx7M-4
function BackButton(props: {
  to: string;
  children: React.ReactNode;
  prefetch?: LinkProps["prefetch"];
}) {
  const { to, children, prefetch } = props;

  return (
    <Link
      to={to}
      prefetch={prefetch}
      className="flex -my-4 xl:mt-0 xl:-mb-2 gap-4 text-base font-normal text-neutral-700 items-center group w-fit focus:outline-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="7"
        height="21"
        viewBox="0 0 7 21"
        fill="none"
      >
        <path
          d="M7 15.1152C6.99996 15.1657 6.98831 15.2161 6.9668 15.2627C6.94524 15.3092 6.91373 15.3521 6.87402 15.3877C6.83434 15.4232 6.78713 15.4514 6.73535 15.4707C6.6833 15.4901 6.62665 15.5 6.57031 15.5C6.51413 15.4999 6.45816 15.49 6.40625 15.4707C6.35446 15.4514 6.30727 15.4232 6.26758 15.3877L1.12598 10.7725C1.08612 10.7368 1.0548 10.6941 1.0332 10.6475C1.0116 10.6007 1 10.5506 1 10.5C1.00001 10.4494 1.01162 10.3992 1.0332 10.3525C1.0548 10.3059 1.08617 10.2632 1.12598 10.2275L6.26758 5.61328C6.30732 5.57752 6.35429 5.54868 6.40625 5.5293C6.45816 5.50996 6.51411 5.50005 6.57031 5.5C6.62667 5.5 6.6833 5.50991 6.73535 5.5293C6.78729 5.54868 6.8343 5.57754 6.87402 5.61328C6.91388 5.64899 6.94521 5.6916 6.9668 5.73828C6.98835 5.78496 7 5.83522 7 5.88574C6.99993 5.9361 6.98828 5.9857 6.9668 6.03223C6.94521 6.07891 6.91388 6.12152 6.87402 6.15723L2.03516 10.5L6.87402 14.8428C6.91386 14.8785 6.94524 14.9211 6.9668 14.9678C6.98835 15.0145 7 15.0647 7 15.1152Z"
          fill="currentColor"
        />
      </svg>
      <span
        className={`group-hover:underline underline-offset-4 leading-[1.2rem] ${getBasicGroupFocusStyles()}`}
      >
        {children}
      </span>
    </Link>
  );
}

export default BackButton;
