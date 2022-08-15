import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { badRequest, forbidden } from "remix-utils";
import { date, InferType, object, string } from "yup";
import { getUserByRequest } from "~/auth.server";
// import useCSRF from "~/lib/hooks/useCSRF";
import { validateFeatureAccess } from "~/lib/utils/application";
import {
  FormError,
  getFormValues,
  nullOrString,
  validateForm,
} from "~/lib/utils/yup";
import { generateEventSlug } from "~/utils";
import { addCsrfTokenToSession, validateCSRFToken } from "~/utils.server";
import { createEventOnProfile } from "./utils.server";

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
    })
    .defined(),
  endTime: nullOrString(string()),
  csrf: string(),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

type LoaderData = {
  id: string;
  csrf: string | null;
};

function getDateTime(date: Date, time: string | null) {
  if (time === null) {
    const copy = new Date(date.getTime());
    copy.setHours(0);
    copy.setMinutes(0);
    copy.setSeconds(0);
    copy.setMilliseconds(0);
    return copy;
  }
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hoursAndMinutes = time.split(":").map(Number);
  return new Date(year, month, day, hoursAndMinutes[0], hoursAndMinutes[1]);
}

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request } = args;
  const currentUser = await getUserByRequest(request);
  if (currentUser === null) {
    throw forbidden({ message: "Not allowed" });
  }

  await validateFeatureAccess(request, "events");

  const csrf = await addCsrfTokenToSession(request);

  return { id: currentUser.id, csrf };
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

  if (errors === null) {
    const slug = generateEventSlug(data.name, Date.now());
    const startTime = getDateTime(data.startDate, data.startTime);

    let endTime;
    if (data.endDate !== null) {
      endTime = getDateTime(data.endDate, data.endTime);
    } else {
      endTime = startTime;
    }

    await createEventOnProfile(currentUser.id, {
      slug,
      name: data.name,
      startTime,
      endTime,
      participationUntil: startTime,
    });
    return redirect(`/event/${slug}`);
  }

  return { data, errors };
};

export default function Create() {
  const loaderData = useLoaderData<LoaderData>();
  // const { hiddenCSRFInput } = useCSRF();

  return (
    <Form method="post">
      <h1>create event</h1>
      <input name="id" defaultValue={loaderData.id} hidden />
      <input name="csrf" defaultValue={loaderData.csrf || ""} hidden />
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
