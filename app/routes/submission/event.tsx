import { ActionFunction, json, LoaderFunction } from "remix";

import { submissionMailer } from "../../lib/submissions/mailer/submissionMailer";
import { EventFormData } from "../../lib/submissions/event/EventFormData";
import * as schema from "../../lib/submissions/event/validation.schema.json";
import { formMapper } from "../../lib/submissions/formMapper/formMapper";
import { validateSubmission } from "../../lib/submissions/validator/validateSubmission";
import { mailerOptions } from "../../lib/submissions/mailer/mailerOptions";

export const loader: LoaderFunction = async (args) => {
  return json(schema);
};

/**
 * TODO: CORS Header? @see https://github.com/sergiodxa/remix-utils
 */
export const action: ActionFunction = async (args): Promise<Response> => {
  let formData = await args.request.formData();
  let EventFormData = formMapper<EventFormData>(formData, schema);
  let errors = validateSubmission<EventFormData>(EventFormData, schema);

  if (errors.length === 0) {
    try {
      await submissionMailer<EventFormData>(
        mailerOptions,
        process.env.SUBMISSION_SENDER as string,
        process.env.EVENTSUBMISSION_RECIPIENT as string,
        process.env.EVENTSUBMISSION_SUBJECT as string,
        EventFormData
      );
    } catch (error) {
      return json(null, { statusText: "mailer Issue", status: 500 });
    }

    return json(null, { statusText: "submitted" });
  }

  return json(errors, { status: 400 });
};
