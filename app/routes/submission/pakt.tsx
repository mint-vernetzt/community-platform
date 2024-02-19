import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import type { PaktFormData } from "../../lib/submissions/forms/pakt/paktFormData";
import * as schema from "../../lib/submissions/forms/pakt/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<PaktFormData>(
    request,
    schema,
    // TODO: can this type assertion be removed and proofen by code?
    process.env.SUBMISSION_SENDER as string,
    process.env.PAKTSUBMISSION_RECIPIENT as string,
    process.env.PAKTSUBMISSION_SUBJECT as string
  );
};
