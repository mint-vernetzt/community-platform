import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils";
import type { NewsFormData } from "../../lib/submissions/forms/news/newsFormData";
import * as schema from "../../lib/submissions/forms/news/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<NewsFormData>(
    request,
    schema,
    // TODO: can this type assertion be removed and proofen by code?
    process.env.SUBMISSION_SENDER as string,
    process.env.NEWSSUBMISSION_RECIPIENT as string,
    process.env.NEWSSUBMISSION_SUBJECT as string
  );
};
