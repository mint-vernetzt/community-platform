import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type PropsWithChildren } from "react";

export type SettingsMenuBackButtonProps = {
  to: string;
};

export function SettingsMenuBackButton(
  props: PropsWithChildren<SettingsMenuBackButtonProps>
) {
  return (
    <div className="@md:mv-hidden">
      <TextButton as="link" to={props.to} arrowLeft size="large">
        {props.children}
      </TextButton>
    </div>
  );
}
