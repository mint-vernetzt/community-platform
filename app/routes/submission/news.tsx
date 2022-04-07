import { ActionFunction, json, LoaderFunction } from "remix";

import { NewsFormData } from "../../lib/submissions/forms/news/newsFormData";
import * as schema from "../../lib/submissions/forms/news/validation.schema.json";
import { processSubmission } from "../../lib/submissions/process/processSubmission";
import { cors } from "remix-utils";

export const loader: LoaderFunction = async ({ request }) => {
  return await cors(request, json(schema));
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response> => {
  return processSubmission<NewsFormData>(
    request,
    schema,
    process.env.SUBMISSION_SENDER as string,
    process.env.NEWSSUBMISSION_RECIPIENT as string,
    process.env.NEWSSUBMISSION_SUBJECT as string
  );
};
