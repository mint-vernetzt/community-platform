import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import classNames from "classnames";

function getFullName(
  data: { academicTitle?: string | null; firstName: string; lastName: string },
  options: { withAcademicTitle: boolean } = { withAcademicTitle: true }
) {
  const { firstName, lastName, academicTitle } = data;

  if (typeof academicTitle === "string" && options.withAcademicTitle === true) {
    return `${academicTitle} ${firstName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}

function getInitials(
  options: { firstName: string; lastName: string } | { name: string }
) {
  if ("name" in options) {
    const splittedName = options.name.split(" ", 2);
    const initials = `${splittedName[0].charAt(0)}${
      splittedName[1]?.charAt(0) || ""
    }`.toUpperCase();
    return initials;
  }

  const { firstName, lastName } = options;
  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : "";
}

type AvatarProps = {
  to?: string;
} & (
  | {
      name: string;
      logo?: string | null;
      blurredLogo?: string;
    }
  | {
      firstName: string;
      lastName: string;
      avatar?: string | null;
      blurredAvatar?: string;
    }
);

export function Avatar(props: AvatarProps) {
  let displayName = "";
  const initials = getInitials(props);
  let src;
  let blurredSrc;
  if ("name" in props) {
    displayName = props.name;
    src = props.logo;
    blurredSrc = props.blurredLogo;
  } else if ("firstName" in props) {
    displayName = getFullName({
      firstName: props.firstName,
      lastName: props.lastName,
    });
    src = props.avatar;
    blurredSrc = props.blurredAvatar;
  }

  const classes = classNames(
    "mv-w-full mv-aspect-[1]",
    "mv-bg-neutral-600 mv-border-gray-200 mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0",
    "mv-text-white mv-font-normal	mv-flex mv-items-center mv-justify-center",
    props.to &&
      "hover:mv-border-0 active:mv-border-0 focus:mv-border-0 hover:mv-shadow-md active:mv-shadow-md focus:mv-shadow-md"
  );

  const child = src ? (
    <Image src={src} blurredSrc={blurredSrc} alt={displayName} />
  ) : (
    <svg width="80%" height="80%" viewBox="0 0 24 24">
      <text
        fill="currentColor"
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {initials}
      </text>
    </svg>
  );

  return (
    <div className={classes}>
      {props.to ? <a href={props.to}>{child}</a> : <>{child}</>}
    </div>
  );
}
