import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { Link } from "@remix-run/react";
import { type PropsWithChildren } from "react";

export type BackButtonProps = {
  to: string;
};

export function BackButton(props: PropsWithChildren<BackButtonProps>) {
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
