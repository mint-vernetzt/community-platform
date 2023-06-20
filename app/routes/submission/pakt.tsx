import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils";
import type { PaktFormData } from "../../lib/submissions/forms/pakt/paktFormData";
import * as schema from "../../lib/submissions/forms/pakt/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader: LoaderFunction = async ({ request }) => {
  return await cors(request, json(schema));
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response> => {
  return processSubmission<PaktFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER as string,
    process.env.PAKTSUBMISSION_RECIPIENT as string,
    process.env.PAKTSUBMISSION_SUBJECT as string
  );
};
