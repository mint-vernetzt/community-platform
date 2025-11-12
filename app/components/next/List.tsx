import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Children, createContext, isValidElement, useContext } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { type z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

const ListContext = createContext<{ hideAfter?: number }>({});

export function useListContext() {
  const context = useContext(ListContext);
  if (context === null) {
    throw new Error("useListContext must be used within a ListContext");
  }
  return context;
}

function Search<
  T extends
    | {
        username: string;
        firstName: string;
        lastName: string;
      }
    | { slug: string; name: string },
>(props: {
  id?: string;
  children?: React.ReactNode;
  searchParam: string;
  defaultItems: T[];
  setValues: React.Dispatch<React.SetStateAction<T[]>>;
  hideUntil?: number;
  locales: { placeholder: string };
  label: string;
  submission: SubmissionResult<string[]>;
  schema: z.ZodTypeAny;
}) {
  const { id = "search-form", submission, schema } = props;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  let defaultValue;
  const searchParamValue = searchParams.get(props.searchParam);
  if (searchParamValue !== null) {
    defaultValue = { [props.searchParam]: searchParamValue };
  }

  const [form, fields] = useForm({
    id,
    defaultValue,
    constraint: getZodConstraint(schema),
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: schema,
      });
    },
    lastResult: navigation.state === "idle" ? submission : null,
  });

  const handleChange: React.ChangeEventHandler<HTMLFormElement> = (event) => {
    form.validate();
    if (form.valid === false) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const searchValue = formData.get(props.searchParam);

    if (typeof searchValue !== "string") {
      return;
    }
    const query = searchValue.trim().split(" ");

    const filteredItems = props.defaultItems.filter((item) => {
      const contains = query.some((term) => {
        return (
          ("firstName" in item &&
            typeof item.firstName === "string" &&
            item.firstName.toLowerCase().includes(term.toLowerCase())) ||
          ("lastName" in item &&
            typeof item.lastName === "string" &&
            item.lastName.toLowerCase().includes(term.toLowerCase())) ||
          ("username" in item &&
            typeof item.username === "string" &&
            item.username.toLowerCase().includes(term.toLowerCase())) ||
          ("name" in item &&
            typeof item.name === "string" &&
            item.name.toLowerCase().includes(term.toLowerCase())) ||
          ("slug" in item &&
            typeof item.slug === "string" &&
            item.slug.toLowerCase().includes(term.toLowerCase()))
        );
      });
      return contains;
    });
    props.setValues(filteredItems);
  };

  const handleReset: React.FormEventHandler<HTMLFormElement> = () => {
    props.setValues(props.defaultItems);
  };

  if (
    searchParamValue === null &&
    typeof props.hideUntil !== "undefined" &&
    props.defaultItems.length <= props.hideUntil
  ) {
    return null;
  }

  return (
    <Form
      {...getFormProps(form)}
      method="get"
      preventScrollReset
      onChange={handleChange}
      onReset={handleReset}
      autoComplete="off"
    >
      {props.children}
      <Input
        {...getInputProps(fields[props.searchParam], {
          type: "text",
        })}
        key={fields[props.searchParam].id}
        placeholder={props.locales.placeholder}
        standalone
        aria-label={props.label}
      >
        <Input.Label htmlFor={fields[props.searchParam].id} hidden>
          {props.locales.placeholder}
        </Input.Label>
        <Input.SearchIcon />
        <Input.ClearIcon />
        <noscript>
          <Input.Controls>
            <Button type="submit">{props.locales.placeholder}</Button>
          </Input.Controls>
        </noscript>
      </Input>
    </Form>
  );
}

function List(props: {
  id: string;
  children: React.ReactNode;
  hideAfter?: number;
  locales: { more: string; less: string };
}) {
  const { children, hideAfter, id, locales } = props;

  const search = Children.toArray(children).find((child) => {
    return isValidElement(child) && child.type === Search;
  });

  const otherChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child) && child.type !== Search;
  });

  return (
    <ListContext value={{ hideAfter }}>
      {search}
      <ul className="grid grid-cols-1 @md:grid-cols-2 gap-4 group">
        {otherChildren}
        {typeof hideAfter !== "undefined" &&
        otherChildren.length > hideAfter ? (
          <div
            key={`show-more-${id}-container`}
            className="@md:col-span-2 w-full flex justify-center pt-2 text-sm text-neutral-600 font-semibold leading-5 justify-self-center"
          >
            <label
              htmlFor={`show-more-${id}`}
              className="flex gap-2 cursor-pointer w-fit"
            >
              <div className="group-has-[:checked]:hidden">
                {insertParametersIntoLocale(locales.more, {
                  count: otherChildren.length - hideAfter,
                })}
              </div>
              <div className="hidden group-has-[:checked]:block">
                {insertParametersIntoLocale(locales.less, {
                  count: otherChildren.length - hideAfter,
                })}
              </div>
              <div className="rotate-90 group-has-[:checked]:-rotate-90">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                    fill="#454C5C"
                  />
                  <path
                    d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                    stroke="#454C5C"
                  />
                </svg>
              </div>
            </label>
            <input
              id={`show-more-${id}`}
              type="checkbox"
              className="w-0 h-0 opacity-0"
            />
          </div>
        ) : null}
      </ul>
    </ListContext>
  );
}

List.Search = Search;

export default List;
