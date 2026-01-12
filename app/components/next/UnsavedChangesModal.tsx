import { type FormMetadata } from "@conform-to/react";
import { useEffect, useState } from "react";
import {
  Form,
  useBlocker,
  useLocation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { Modal } from "~/components-next/Modal";
import { extendSearchParams, LastTimeStamp } from "~/lib/utils/searchParams";

export function UnsavedChangesModal(props: {
  searchParam: string;
  formMetadataToCheck: FormMetadata<any> | FormMetadata<any>[];
  locales: {
    title: string;
    description: string;
    proceed: string;
    cancel: string;
  };
  lastTimeStamp: number;
}) {
  const { searchParam, formMetadataToCheck, locales, lastTimeStamp } = props;
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
  const [nextLocationPathname, setNextLocationPathname] = useState<
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
        addOrReplace: {
          [searchParam]: "true",
          [LastTimeStamp]: `${lastTimeStamp}`,
        },
      });
      void submit(newSearchParams, { method: "get" });
    }
    return isBlocked;
  });

  useEffect(() => {
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
        <Modal.Title>{locales.title}</Modal.Title>
        <Modal.Section>{locales.description}</Modal.Section>
        <Modal.SubmitButton form="discard-changes-and-proceed">
          {locales.proceed}
        </Modal.SubmitButton>
        <Modal.CloseButton
          route={`${location.pathname}?${searchParamsWithoutModal.toString()}`}
          // onClick={() => {
          //   setNextLocationPathname(null);
          // }}
        >
          {locales.cancel}
        </Modal.CloseButton>
      </Modal>
    </>
  );
}
