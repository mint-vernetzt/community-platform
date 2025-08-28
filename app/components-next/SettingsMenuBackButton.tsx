import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type PropsWithChildren } from "react";
import { type LinkProps } from "react-router";

export type SettingsMenuBackButtonProps = {
  to: string;
  prefetch?: LinkProps["prefetch"];
};

export function SettingsMenuBackButton(
  props: PropsWithChildren<SettingsMenuBackButtonProps>
) {
  return (
    <div className="@md:mv-hidden">
      <TextButton
        as="link"
        to={props.to}
        arrowLeft
        size="large"
        prefetch={props.prefetch}
      >
        {props.children}
      </TextButton>
    </div>
  );
}
