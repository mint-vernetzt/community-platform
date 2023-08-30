import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils";
import type { PaktFormData } from "../../lib/submissions/forms/pakt/paktFormData";
import * as schema from "../../lib/submissions/forms/pakt/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: DataFunctionArgs) => {
  return await cors(request, json(schema));
};

export const action = async ({ request }: DataFunctionArgs) => {
  return processSubmission<PaktFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER as string,
    process.env.PAKTSUBMISSION_RECIPIENT as string,
    process.env.PAKTSUBMISSION_SUBJECT as string
  );
};
