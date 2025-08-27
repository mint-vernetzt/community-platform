import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type LinkProps } from "react-router";

export function BackButton(props: {
  to: string;
  children: React.ReactNode;
  prefetch?: LinkProps["prefetch"];
}) {
  const { to, children, prefetch } = props;

  return (
    <TextButton
      as="link"
      to={to}
      arrowLeft
      variant="dark"
      weight="base"
      prefetch={prefetch}
    >
      {children}
    </TextButton>
  );
}
