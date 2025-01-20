import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type PropsWithChildren } from "react";

export type BackButtonProps = {
  to: string;
};

export function BackButton(props: PropsWithChildren<BackButtonProps>) {
  return (
    <div className="@md:mv-hidden">
      {/* TODO: I want prefetch intent here but the TextButton cannot be used with a remix Link wrapped inside. */}
      <TextButton as="a" href={props.to} arrowLeft size="large">
        {props.children}
      </TextButton>
    </div>
  );
}
