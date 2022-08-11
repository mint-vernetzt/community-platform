import { ActionFunction, Form, LoaderFunction } from "remix";
import { forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { validateFeatureAccess } from "~/lib/utils/application";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const currentUser = await getUserByRequest(request);
  if (currentUser === null) {
    throw forbidden({ message: "Not allowed" });
  }

  await validateFeatureAccess(request, "events");

  return { id: currentUser.id };
};

export const action: ActionFunction = async (args) => {
  return null;
};

export default function Create() {
  return (
    <Form>
      <h1>create event</h1>
      <div className="m-2">
        <label htmlFor="name">Name*</label>
        <input id="name" type="text" className="mx-2 border" required />
      </div>
      <div className="m-2">
        <label htmlFor="startDate">Start Date*</label>
        <input id="startDate" type="date" className="mx-2 border" required />
        <label htmlFor="startTime">Start Time</label>
        <input id="starTime" type="time" className="mx-2 border" required />
      </div>
      <div className="m-2">
        <label htmlFor="endDate">End Date*</label>
        <input id="endDate" type="date" className="mx-2 border" required />
        <label htmlFor="endTime">End Dime</label>
        <input id="endTime" type="time" className="mx-2 border" required />
      </div>
      <div className="m-2">
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </Form>
  );
}
