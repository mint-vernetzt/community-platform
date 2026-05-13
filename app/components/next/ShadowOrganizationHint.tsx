// Design
// Name: Hinweis_von uns angelegte Organisationen
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=11230-5761&t=udN2CMVcJtKPPrNQ-4

import { Children, isValidElement } from "react";

function ShadowOrganizationHint(props: { children: React.ReactNode }) {
  const { children } = props;

  const description = Children.toArray(children).find(
    (child) =>
      isValidElement(child) && child.type === ShadowOrganizationHintDescription
  );

  const controls = Children.toArray(children).filter(
    (child) =>
      isValidElement(child) && child.type === ShadowOrganizationHintControls
  );

  return (
    <div className="w-full p-4 flex flex-col @md:flex-row @md:justify-between items-center gap-4 rounded-sm bg-primary-50">
      {typeof description !== "undefined" ? description : null}
      {controls.length > 0 ? controls.map((control) => control) : null}
    </div>
  );
}

function ShadowOrganizationHintDescription(props: React.PropsWithChildren) {
  const { children } = props;
  return <p className="text-primary-700 @md:max-w-200">{children}</p>;
}

function ShadowOrganizationHintControls(props: React.PropsWithChildren) {
  const { children } = props;
  return <>{children}</>;
}

ShadowOrganizationHint.Description = ShadowOrganizationHintDescription;
ShadowOrganizationHint.Controls = ShadowOrganizationHintControls;

export default ShadowOrganizationHint;
