import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import type { EventFormData } from "../../lib/submissions/forms/event/eventFormData";
import * as schema from "../../lib/submissions/forms/event/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<EventFormData>(
    request,
    schema,
    // TODO: can this type assertion be removed and proofen by code?
    process.env.SUBMISSION_SENDER as string,
    process.env.EVENTSUBMISSION_RECIPIENT as string,
    process.env.EVENTSUBMISSION_SUBJECT as string
  );
};
