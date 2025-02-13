import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { cors } from "remix-utils/cors";
import type { NewsFormData } from "../../lib/submissions/forms/news/newsFormData";
import * as schema from "../../lib/submissions/forms/news/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await cors(request, Response.json(schema));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return processSubmission<NewsFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER,
    process.env.NEWSSUBMISSION_RECIPIENT,
    process.env.NEWSSUBMISSION_SUBJECT
  );
};
