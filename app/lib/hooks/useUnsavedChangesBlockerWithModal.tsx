import { type FormMetadata } from "@conform-to/react-v1";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  useBlocker,
  useLocation,
  useSearchParams,
  useSubmit,
} from "react-router-dom";
import { Modal } from "~/routes/__components";
import { extendSearchParams } from "../utils/searchParams";

export const i18nNS = ["components"];

export function useUnsavedChangesBlockerWithModal(options: {
  searchParam: string;
  formMetadataToCheck: FormMetadata<any> | FormMetadata<any>[];
}) {
  const { searchParam, formMetadataToCheck } = options;
  let forms = formMetadataToCheck;
  if (Array.isArray(forms) === false) {
    forms = [forms];
  }
  const location = useLocation();
  const { t } = useTranslation(i18nNS);
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
        <Modal.Title>{t("UnsavedChangesModal.title")}</Modal.Title>
        <Modal.Section>{t("UnsavedChangesModal.description")}</Modal.Section>
        <Modal.SubmitButton form="discard-changes-and-proceed">
          {t("UnsavedChangesModal.proceed")}
        </Modal.SubmitButton>
        <Modal.CloseButton
          route={`${location.pathname}?${searchParamsWithoutModal.toString()}`}
          onClick={() => {
            setNextLocationPathname(null);
          }}
        >
          {t("UnsavedChangesModal.cancel")}
        </Modal.CloseButton>
      </Modal>
    </>
  );
}
