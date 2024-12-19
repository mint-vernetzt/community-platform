import { TextButton } from "@mint-vernetzt/components";
import { Link } from "@remix-run/react";

export type BackButtonProps = {
  to: string;
};

export function BackButton(props: React.PropsWithChildren<{ to: string }>) {
  return (
    <div className="@md:mv-hidden">
      <TextButton arrowLeft size="large">
        <Link to={props.to} prefetch="intent">
          {props.children}
        </Link>
      </TextButton>
    </div>
  );
}
