import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { cors } from "remix-utils/cors";
import type { EventFormData } from "../../lib/submissions/forms/event/eventFormData";
import * as schema from "../../lib/submissions/forms/event/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, Response.json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<EventFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER,
    process.env.EVENTSUBMISSION_RECIPIENT,
    process.env.EVENTSUBMISSION_SUBJECT
  );
};
