import { ActionFunction, json, LoaderFunction } from "@remix-run/node";

import { EventFormData } from "../../lib/submissions/forms/event/eventFormData";
import * as schema from "../../lib/submissions/forms/event/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";
import { cors } from "remix-utils";

export const loader: LoaderFunction = async ({ request }) => {
  return await cors(request, json(schema));
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response> => {
  return processSubmission<EventFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER as string,
    process.env.EVENTSUBMISSION_RECIPIENT as string,
    process.env.EVENTSUBMISSION_SUBJECT as string
  );
};
