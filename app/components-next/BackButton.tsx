import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type LinkProps } from "react-router";

export function BackButton(
  props: {
    to: string;
    children: React.ReactNode;
  } & LinkProps &
    React.RefAttributes<HTMLAnchorElement>
) {
  const { to, children, ...linkProps } = props;

  return (
    <TextButton
      as="link"
      to={to}
      arrowLeft
      variant="dark"
      weight="base"
      {...linkProps}
    >
      {children}
    </TextButton>
  );
}
