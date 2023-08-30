import type { ActionFunction, DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils";
import type { EventFormData } from "../../lib/submissions/forms/event/eventFormData";
import * as schema from "../../lib/submissions/forms/event/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: DataFunctionArgs) => {
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
