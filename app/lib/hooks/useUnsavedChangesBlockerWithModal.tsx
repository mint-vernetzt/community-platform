import { type FormMetadata } from "@conform-to/react-v1";
import React from "react";
import {
  Form,
  useBlocker,
  useLocation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { Modal } from "~/components-next/Modal";
import { extendSearchParams } from "../utils/searchParams";
import { type ChangeOrganizationUrlLocales } from "~/routes/organization/$slug/settings/danger-zone/change-url.server";
import { type OrganizationWebAndSocialLocales } from "~/routes/organization/$slug/settings/web-social.server";
import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type ManageOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/manage.server";
import { type ProjectWebAndSocialLocales } from "~/routes/project/$slug/settings/web-social.server";

export function useUnsavedChangesBlockerWithModal(options: {
  searchParam: string;
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formMetadataToCheck: FormMetadata<any> | FormMetadata<any>[];
  locales:
    | ChangeOrganizationUrlLocales
    | OrganizationWebAndSocialLocales
    | GeneralOrganizationSettingsLocales
    | ManageOrganizationSettingsLocales
    | ProjectWebAndSocialLocales;
}) {
  const { searchParam, formMetadataToCheck, locales } = options;
  let forms = formMetadataToCheck;
  if (Array.isArray(forms) === false) {
    forms = [forms];
  }
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchParamsWithoutModal = extendSearchParams(searchParams, {
    remove: [searchParam],
  });
  const submit = useSubmit();
  const [nextLocationPathname, setNextLocationPathname] = React.useState<
    string | null
  >(null);
  useBlocker(({ currentLocation, nextLocation }) => {
    const modalIsOpen = nextLocation.search.includes(searchParam);
    if (modalIsOpen || nextLocationPathname !== null) {
      return false;
    }
    const isBlocked =
      forms.some((form) => form.dirty) &&
      currentLocation.pathname !== nextLocation.pathname;
    if (isBlocked) {
      setNextLocationPathname(nextLocation.pathname);
      const newSearchParams = extendSearchParams(searchParams, {
        addOrReplace: { [searchParam]: "true" },
      });
      submit(newSearchParams, { method: "get" });
    }
    return isBlocked;
  });

  React.useEffect(() => {
    if (searchParams.has(searchParam) === false) {
      setNextLocationPathname(null);
    }
  }, [searchParams, searchParam]);

  return (
    <>
      <Form
        id="discard-changes-and-proceed"
        method="get"
        action={
          nextLocationPathname !== null
            ? nextLocationPathname
            : `${location.pathname}?${searchParamsWithoutModal.toString()}`
        }
        hidden
        preventScrollReset
      />
      <Modal searchParam={`modal-unsaved-changes`}>
        <Modal.Title>
          {locales.components.UnsavedChangesModal.title}
        </Modal.Title>
        <Modal.Section>
          {locales.components.UnsavedChangesModal.description}
        </Modal.Section>
        <Modal.SubmitButton form="discard-changes-and-proceed">
          {locales.components.UnsavedChangesModal.proceed}
        </Modal.SubmitButton>
        <Modal.CloseButton
          route={`${location.pathname}?${searchParamsWithoutModal.toString()}`}
          // onClick={() => {
          //   setNextLocationPathname(null);
          // }}
        >
          {locales.components.UnsavedChangesModal.cancel}
        </Modal.CloseButton>
      </Modal>
    </>
  );
}
