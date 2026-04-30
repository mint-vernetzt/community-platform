import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  CircleButton,
  type CustomCircleButtonProps,
} from "@mint-vernetzt/components/src/molecules/CircleButton";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import classNames from "classnames";
import {
  type ButtonHTMLAttributes,
  Children,
  createContext,
  type ForwardRefExoticComponent,
  type InputHTMLAttributes,
  isValidElement,
  type RefAttributes,
  useContext,
} from "react";
import {
  Form,
  type FormProps,
  Link,
  type LinkProps,
  useLocation,
  useNavigation,
  useSearchParams,
} from "react-router";
import {
  Modal,
  type ModalCloseButtonProps,
  type ModalProps,
  type ModalSubmitButtonProps,
} from "~/components-next/Modal";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { extendSearchParams } from "~/lib/utils/searchParams";
import {
  DOCUMENT_DESCRIPTION_FIELD_NAME,
  DOCUMENT_DESCRIPTION_MAX_LENGTH,
  DOCUMENT_ID_FIELD_NAME,
  DOCUMENT_TITLE_FIELD_NAME,
  EDIT_DOCUMENT_INTENT_VALUE,
  getEditDocumentSchema,
  REMOVE_DOCUMENT_INTENT_VALUE,
} from "~/storage.shared";
import { useListContext } from "./List";
import { OverlayMenu, type OverlayMenuProps } from "./OverlayMenu";
import { FileTypePDFIcon } from "./icons/FileTypePDFIcon";

// Design:
// Name: List item (Material)
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=8295-102063&t=RJvvlCKHSMjVtZMO-4

const ListItemMaterialContext = createContext<{
  type?: "image" | "pdf";
}>({});

export function useListItemMaterialContext() {
  const context = useContext(ListItemMaterialContext);
  if (context === null) {
    throw new Error(
      "useListItemMaterialContext must be used within a ListItemMaterialContext"
    );
  }
  return context;
}

function ListItemMaterial(props: {
  children: React.ReactNode;
  index: number;
  type: "image" | "pdf";
  sizeInMB: number;
}) {
  const { children, index, type, sizeInMB } = props;
  const { hideAfter } = useListContext();

  const hideClasses = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-checked:block"
      : "block"
  );

  const classes = classNames(
    "@container/list-item-material flex gap-4 items-center border border-neutral-200 rounded-lg h-24",
    type === "pdf" && "pl-4 sm:pl-0"
  );

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  const image = validChildren.find((child) => {
    return isValidElement(child) && child.type === Image && type !== "pdf";
  });

  const imageClasses = classNames(
    "h-23.5 w-36 min-w-36 rounded-l-[7px] overflow-hidden",
    type === "pdf" &&
      "hidden sm:flex bg-primary-100 items-center justify-center"
  );
  const headline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemMaterial.Headline;
  });
  const headlineSuffixClasses = classNames(
    "text-neutral-700 text-base font-normal leading-5 text-nowrap",
    type === "image" && "hidden sm:block"
  );
  const subline = validChildren.find((child) => {
    return (
      isValidElement(child) &&
      child.type === ListItemMaterial.Subline &&
      type !== "pdf"
    );
  });
  const controls = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemMaterial.Controls;
  });

  return (
    <ListItemMaterialContext
      value={{
        type: type,
      }}
    >
      <li className={hideClasses}>
        <div className={classes}>
          <div className={imageClasses}>
            {type === "image" ? image : <FileTypePDFIcon />}
          </div>
          <div className="flex flex-col grow">
            <div className="flex flex-col @large-list-item/list-item-material:flex-row @large-list-item/list-item-material:gap-1">
              {headline}
              <div className={headlineSuffixClasses}>
                {type === "pdf" ? "(PDF" : "(jpg"},{" "}
                {sizeInMB < 1
                  ? `${Math.round(sizeInMB * 1024)} KB)`
                  : `${Math.round(sizeInMB)} MB)`}
              </div>
            </div>
            {subline}
          </div>
          {controls}
        </div>
      </li>
    </ListItemMaterialContext>
  );
}

function ListItemHeadline(props: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-700 text-base font-bold leading-5 line-clamp-2 @large-list-item/list-item-material:line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemSubline(props: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-600 text-sm font-normal leading-normal line-clamp-1 @large-list-item/list-item-material:line-clamp-1">
      {props.children}
    </div>
  );
}

const ListItemControlsContext = createContext<{
  searchParam: string;
} | null>(null);

export function useListItemControlsContext() {
  const context = useContext(ListItemControlsContext);
  if (context === null) {
    throw new Error(
      "useListItemControlsContext must be used within a ListItemControlsContext"
    );
  }
  return context;
}

function ListItemControls(props: {
  children: React.ReactNode;
  overlayMenuProps?: OverlayMenuProps;
}) {
  const { children, overlayMenuProps } = props;

  const useOverlayMenu = typeof overlayMenuProps !== "undefined";

  return (
    <ListItemControlsContext
      value={
        useOverlayMenu ? { searchParam: overlayMenuProps.searchParam } : null
      }
    >
      {useOverlayMenu ? (
        <div className="pr-4">
          <OverlayMenu {...overlayMenuProps}>
            {Children.toArray(children).map((child, index) => {
              if (isValidElement(child)) {
                return (
                  <OverlayMenu.ListItem key={index}>
                    {child}
                  </OverlayMenu.ListItem>
                );
              }
            })}
          </OverlayMenu>
        </div>
      ) : (
        <div className="flex gap-4 pr-4">{children}</div>
      )}
    </ListItemControlsContext>
  );
}

function ListItemControlsDownload(
  props: { label: string } & LinkProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const { label, ...linkProps } = props;
  const useOverlayMenu = useListItemControlsContext();

  const downloadIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M0.625 12.375C0.970178 12.375 1.25 12.6549 1.25 13V16.125C1.25 16.8154 1.80964 17.375 2.5 17.375H17.5C18.1904 17.375 18.75 16.8154 18.75 16.125V13C18.75 12.6549 19.0298 12.375 19.375 12.375C19.7202 12.375 20 12.6549 20 13V16.125C20 17.5057 18.8807 18.625 17.5 18.625H2.5C1.11929 18.625 0 17.5057 0 16.125V13C0 12.6549 0.279822 12.375 0.625 12.375Z"
        fill="currentColor"
      />
      <path
        d="M9.55806 14.8169C9.80214 15.061 10.1979 15.061 10.4419 14.8169L14.1919 11.0669C14.436 10.8229 14.436 10.4271 14.1919 10.1831C13.9479 9.93898 13.5521 9.93898 13.3081 10.1831L10.625 12.8661V1.875C10.625 1.52982 10.3452 1.25 10 1.25C9.65482 1.25 9.375 1.52982 9.375 1.875V12.8661L6.69194 10.1831C6.44786 9.93898 6.05214 9.93898 5.80806 10.1831C5.56398 10.4271 5.56398 10.8229 5.80806 11.0669L9.55806 14.8169Z"
        fill="currentColor"
      />
    </svg>
  );

  const circleButton = (
    <CircleButton
      as={"link"}
      aria-label={label}
      reloadDocument
      variant="ghost"
      {...linkProps}
    >
      {downloadIcon}
    </CircleButton>
  );

  return useOverlayMenu === null ? (
    circleButton
  ) : (
    <Link
      {...OverlayMenu.getListChildrenStyles()}
      reloadDocument
      {...linkProps}
    >
      {downloadIcon}
      <span>{label}</span>
    </Link>
  );
}

function ListItemControlsRemove(props: {
  documentId: string;
  label: string;
  circleSubmitButtonProps?: CustomCircleButtonProps &
    ButtonHTMLAttributes<HTMLButtonElement>;
  formProps?: ForwardRefExoticComponent<
    FormProps & RefAttributes<HTMLFormElement>
  >;
  overlaySubmitButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  idInputProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const {
    documentId,
    label,
    circleSubmitButtonProps,
    overlaySubmitButtonProps,
    idInputProps,
    formProps,
  } = props;
  const useOverlayMenu = useListItemControlsContext();

  console.log(useOverlayMenu);

  const removeIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.875 6.875C7.22018 6.875 7.5 7.15482 7.5 7.5V15C7.5 15.3452 7.22018 15.625 6.875 15.625C6.52982 15.625 6.25 15.3452 6.25 15V7.5C6.25 7.15482 6.52982 6.875 6.875 6.875Z"
        fill="#3C4658"
      />
      <path
        d="M10 6.875C10.3452 6.875 10.625 7.15482 10.625 7.5V15C10.625 15.3452 10.3452 15.625 10 15.625C9.65482 15.625 9.375 15.3452 9.375 15V7.5C9.375 7.15482 9.65482 6.875 10 6.875Z"
        fill="#3C4658"
      />
      <path
        d="M13.75 7.5C13.75 7.15482 13.4702 6.875 13.125 6.875C12.7798 6.875 12.5 7.15482 12.5 7.5V15C12.5 15.3452 12.7798 15.625 13.125 15.625C13.4702 15.625 13.75 15.3452 13.75 15V7.5Z"
        fill="#3C4658"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.125 3.75C18.125 4.44036 17.5654 5 16.875 5H16.25V16.25C16.25 17.6307 15.1307 18.75 13.75 18.75H6.25C4.86929 18.75 3.75 17.6307 3.75 16.25V5H3.125C2.43464 5 1.875 4.44036 1.875 3.75V2.5C1.875 1.80964 2.43464 1.25 3.125 1.25H7.5C7.5 0.559644 8.05964 0 8.75 0H11.25C11.9404 0 12.5 0.559644 12.5 1.25H16.875C17.5654 1.25 18.125 1.80964 18.125 2.5V3.75ZM5.14754 5L5 5.07377V16.25C5 16.9404 5.55964 17.5 6.25 17.5H13.75C14.4404 17.5 15 16.9404 15 16.25V5.07377L14.8525 5H5.14754ZM3.125 3.75V2.5H16.875V3.75H3.125Z"
        fill="#3C4658"
      />
    </svg>
  );

  const circleButton = (
    <CircleButton
      as={"button"}
      type="submit"
      aria-label={label}
      variant="ghost"
      name={INTENT_FIELD_NAME}
      value={REMOVE_DOCUMENT_INTENT_VALUE}
      {...circleSubmitButtonProps}
    >
      {removeIcon}
    </CircleButton>
  );

  return (
    <>
      <Form
        id={`remove-document-form-${documentId}`}
        method="POST"
        preventScrollReset
        hidden
        {...formProps}
      />
      <input
        form={`remove-document-form-${documentId}`}
        name={DOCUMENT_ID_FIELD_NAME}
        defaultValue={documentId}
        hidden
        {...idInputProps}
      />
      {useOverlayMenu !== null ? (
        <button
          {...OverlayMenu.getListChildrenStyles()}
          form={`remove-document-form-${documentId}`}
          type="submit"
          name={INTENT_FIELD_NAME}
          value={REMOVE_DOCUMENT_INTENT_VALUE}
          {...overlaySubmitButtonProps}
        >
          {removeIcon}
          <span>{label}</span>
        </button>
      ) : (
        circleButton
      )}
    </>
  );
}

function ListItemControlsEdit(props: {
  document: {
    id: string;
    title: string | null;
    description: string | null;
  };
  label: string;
  lastResult: SubmissionResult<string[]> | undefined;
  modalProps: ModalProps;
  modalSubmitButtonProps?: ModalSubmitButtonProps;
  modalCloseButtonProps?: ModalCloseButtonProps;
  useFormOptions?: Parameters<typeof useForm>;
  formProps?: ForwardRefExoticComponent<
    FormProps & RefAttributes<HTMLFormElement>
  >;
  idInputProps?: InputHTMLAttributes<HTMLInputElement>;
  locales: {
    headline: string;
    title: {
      label: string;
      helperText: string;
    };
    description: {
      label: string;
      helperText: string;
    };
    submit: string;
    close: string;
    descriptionTooLong: string;
  };
}) {
  const {
    document,
    label,
    lastResult,
    modalProps,
    modalSubmitButtonProps,
    modalCloseButtonProps,
    useFormOptions,
    formProps,
    idInputProps,
    locales,
  } = props;
  const useOverlayMenu = useListItemControlsContext();
  const location = useLocation();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const [editForm, editFields] = useForm({
    id: `edit-document-form-${document.id}`,
    constraint: getZodConstraint(getEditDocumentSchema(locales)),
    defaultValue: {
      [DOCUMENT_ID_FIELD_NAME]: document.id,
      [DOCUMENT_TITLE_FIELD_NAME]: document.title,
      [DOCUMENT_DESCRIPTION_FIELD_NAME]: document.description,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? lastResult : undefined,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: getEditDocumentSchema(locales),
      });
      return submission;
    },
    ...useFormOptions,
  });

  const editIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
        fill="#3C4658"
      />
    </svg>
  );

  const circleButton = (
    <CircleButton
      as={"link"}
      to={`${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [modalProps.searchParam]: "true" } }).toString()}`}
      aria-label={label}
      variant="ghost"
    >
      {editIcon}
    </CircleButton>
  );

  console.log(modalProps);

  return (
    <>
      <Form
        {...getFormProps(editForm)}
        method="POST"
        preventScrollReset
        hidden
        {...formProps}
      />
      <Modal {...modalProps}>
        <Modal.Title>{locales.headline}</Modal.Title>
        <Modal.Section>
          <input
            {...getInputProps(editFields.documentId, { type: "hidden" })}
            form={`edit-document-form-${document.id}`}
            {...idInputProps}
          />
          <Input {...getInputProps(editFields.title, { type: "text" })}>
            <Input.Label htmlFor={editFields.title.id}>
              {locales.title.label}
            </Input.Label>
            {typeof editFields.title.errors !== "undefined" &&
            editFields.title.errors.length > 0
              ? editFields.title.errors.map((error) => (
                  <Input.Error id={editFields.title.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))
              : null}
          </Input>
          <Input
            {...getInputProps(editFields.description, { type: "text" })}
            maxLength={DOCUMENT_DESCRIPTION_MAX_LENGTH}
          >
            <Input.Label htmlFor={editFields.description.id}>
              {locales.description.label}
            </Input.Label>
            {typeof editFields.description.errors !== "undefined" &&
            editFields.description.errors.length > 0 ? (
              editFields.description.errors.map((error) => (
                <Input.Error id={editFields.description.errorId} key={error}>
                  {error}
                </Input.Error>
              ))
            ) : (
              <Input.HelperText>
                {locales.description.helperText}
              </Input.HelperText>
            )}
          </Input>
        </Modal.Section>
        <Modal.SubmitButton
          form={`edit-document-form-${document.id}`}
          name={INTENT_FIELD_NAME}
          value={EDIT_DOCUMENT_INTENT_VALUE}
          {...modalSubmitButtonProps}
        >
          {locales.submit}
        </Modal.SubmitButton>
        <Modal.CloseButton {...modalCloseButtonProps}>
          {locales.close}
        </Modal.CloseButton>
      </Modal>
      {useOverlayMenu === null ? (
        circleButton
      ) : (
        <>
          <Link
            {...OverlayMenu.getListChildrenStyles()}
            {...OverlayMenu.getIdToFocusWhenOpening()}
            to={`${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [modalProps.searchParam]: "true" } }).toString()}`}
            onClick={() => {
              editForm.reset();
            }}
          >
            {editIcon}
            <span>{label}</span>
          </Link>
        </>
      )}
    </>
  );
}

ListItemMaterial.Subline = ListItemSubline;
ListItemMaterial.Headline = ListItemHeadline;
ListItemMaterial.Image = Image;
ListItemMaterial.Controls = ListItemControls;
ListItemControls.Download = ListItemControlsDownload;
ListItemControls.Remove = ListItemControlsRemove;
ListItemControls.Edit = ListItemControlsEdit;

export default ListItemMaterial;
