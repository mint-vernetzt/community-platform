import { getFormProps, useForm } from "@conform-to/react";
import { createContext, useContext } from "react";
import { Form, type FormProps } from "react-router";

const ConformContext = createContext<{
  form: ReturnType<typeof useForm>[0];
  fields: ReturnType<typeof useForm>[1];
  useFormOptions: Parameters<typeof useForm>[0];
} | null>(null);

function useConformForm() {
  const context = useContext(ConformContext);
  if (context === null) {
    throw new Error("Missing ConformContext.Provider");
  }
  return context;
}

function ConformForm(
  props: React.PropsWithChildren & {
    useFormOptions: Parameters<typeof useForm>[0];
    formProps?: FormProps & React.RefAttributes<HTMLFormElement>;
  }
) {
  const { useFormOptions, formProps, children } = props;

  const [form, fields] = useForm(useFormOptions);

  return (
    <ConformContext.Provider value={{ form, fields, useFormOptions }}>
      <Form {...getFormProps(form)} {...formProps}>
        {children}
      </Form>
    </ConformContext.Provider>
  );
}

export { ConformForm, useConformForm };
