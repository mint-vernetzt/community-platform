import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import classNames from "classnames";
import { Link } from "react-router";

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
    "w-full aspect-[1]",
    "bg-neutral-600 border-neutral-200 flex items-center justify-center rounded-full overflow-hidden shrink-0",
    "text-white font-normal	flex items-center justify-center",
    props.to &&
      "hover:border-0 active:border-2 focus-within:border-2 active:border-blue-500 focus-within:border-blue-500 hover:shadow-md active:shadow-md focus:shadow-md"
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
      {props.to ? <Link to={props.to}>{child}</Link> : <>{child}</>}
    </div>
  );
}
