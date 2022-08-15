import { Loader } from "@storybook/addons";
import { ActionFunction, Form, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden } from "remix-utils";
import { date, InferType, object, string } from "yup";
import { getUserByRequest } from "~/auth.server";
import useCSRF from "~/lib/hooks/useCSRF";
import { validateFeatureAccess } from "~/lib/utils/application";
import {
  FormError,
  getFormValues,
  nullOrString,
  validateForm,
} from "~/lib/utils/yup";
import { validateCSRFToken } from "~/utils.server";

const schema = object({
  id: string().uuid().required(),
  name: string().required("Please add event name"),
  startDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable()
    .required("Please add a start date"),
  startTime: nullOrString(string()),
  endDate: date()
    .nullable()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    }),
  endTime: string(),
  csrf: string(),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

type LoaderData = {
  id: string;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request } = args;
  const currentUser = await getUserByRequest(request);
  if (currentUser === null) {
    throw forbidden({ message: "Not allowed" });
  }

  await validateFeatureAccess(request, "events");

  return { id: currentUser.id };
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  // TODO: Do we need user id in combination with csrf?
  await validateCSRFToken(request);

  let parsedFormData = await getFormValues<SchemaType>(request, schema);

  const currentUser = await getUserByRequest(request);
  if (currentUser === null || currentUser.id !== parsedFormData.id) {
    throw forbidden({ message: "Not allowed" });
  }

  let errors: FormError | null;
  let data: FormType;

  try {
    let result = await validateForm<SchemaType>(schema, parsedFormData);
    errors = result.errors;
    data = result.data;
  } catch (error) {
    throw badRequest({ message: "Validation failed" });
  }

  return { data, errors };
};

export default function Create() {
  const loaderData = useLoaderData<LoaderData>();
  const { csrfToken = "" } = useCSRF();

  return (
    <Form method="post">
      <h1>create event</h1>
      <input name="id" defaultValue={loaderData.id} hidden />
      <input name="csrf" defaultValue={csrfToken as string} hidden />
      <div className="m-2">
        <label htmlFor="name">Name*</label>
        <input
          id="name"
          name="name"
          type="text"
          className="mx-2 border"
          required
        />
      </div>
      <div className="m-2">
        <label htmlFor="startDate">Start Date*</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          className="mx-2 border"
          required
        />
        <label htmlFor="startTime">Start Time</label>
        <input
          id="startTime"
          name="startTime"
          type="time"
          className="mx-2 border"
        />
      </div>
      <div className="m-2">
        <label htmlFor="endDate">End Date</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          className="mx-2 border"
        />
        <label htmlFor="endTime">End Time</label>
        <input
          id="endTime"
          name="endTime"
          type="time"
          className="mx-2 border"
        />
      </div>
      <div className="m-2">
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </Form>
  );
}
