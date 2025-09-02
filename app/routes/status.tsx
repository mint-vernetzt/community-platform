import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint } from "@conform-to/zod-v1";
import { useLoaderData } from "react-router";
import { z } from "zod";

const schema = z.object({
  test: z.string(),
  test2: z.string(),
});

export const loader = async () => {
  return { message: "Server is up and running" };
};

export const action = async () => {
  return { message: "Server is up and running" };
};

export default function Status() {
  const loaderData = useLoaderData<typeof loader>();

  const [form, fields] = useForm({
    id: "test",
    constraint: getZodConstraint(schema),
    defaultValue: {
      test: "abc",
      test2: "def",
    },
    shouldDirtyConsider: (name) => {
      return name === "test2";
    },
  });

  return (
    <>
      <h1>Status</h1>
      <p>{loaderData.message}</p>
      <form {...getFormProps(form)} method="post">
        <input {...getInputProps(fields.test, { type: "text" })} />
        <input {...getInputProps(fields.test2, { type: "text" })} />
      </form>
      <p>{form.dirty ? "Form is dirty" : "Form is pristine"}</p>
    </>
  );
}
