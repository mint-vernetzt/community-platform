import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type PropsWithChildren } from "react";

export type BackButtonProps = {
  to: string;
};

export function BackButton(props: PropsWithChildren<BackButtonProps>) {
  return (
    <div className="@md:mv-hidden">
      <TextButton as="link" to={props.to} arrowLeft size="large">
        {props.children}
      </TextButton>
    </div>
  );
}
