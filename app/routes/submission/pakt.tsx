import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { cors } from "remix-utils/cors";
import type { PaktFormData } from "../../lib/submissions/forms/pakt/paktFormData";
import * as schema from "../../lib/submissions/forms/pakt/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, Response.json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<PaktFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER,
    process.env.PAKTSUBMISSION_RECIPIENT,
    process.env.PAKTSUBMISSION_SUBJECT
  );
};
