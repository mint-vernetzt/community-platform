import { useForm } from "react-hook-form";
import { ActionFunction, Form, LoaderFunction, useLoaderData } from "remix";
import { InferType, object, string } from "yup";
import { getFormValues, validateForm } from "~/lib/utils/yup";

const schema = object({
  test: string()
    .transform((value: string) => (value === "" ? null : value))
    .nullable()
    .defined(),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

export const loader: LoaderFunction = async (args) => {
  return { test: "Colin und Manu" };
};

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const parsedFormData = await getFormValues<SchemaType>(request, schema);
  const { errors, data } = await validateForm<SchemaType>(
    schema,
    parsedFormData
  );

  if (errors) {
    console.log("errors:", errors);
  }

  console.log("data:", data);

  return null;
};

function Test() {
  const loaderData = useLoaderData<FormType>();

  const methods = useForm<FormType>({
    defaultValues: loaderData,
  });

  const { register } = methods;

  return (
    <Form method="post">
      <label htmlFor="test">Test</label>
      <input
        id="test"
        className="border-2 border-cyan-900"
        type="text"
        {...register("test")}
      />
      <button type="submit">Ok</button>
    </Form>
  );
}

export default Test;
