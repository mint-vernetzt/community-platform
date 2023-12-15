import { type Schema } from "jsonschema";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/build/server/cors";
import { formMapper } from "../formMapper/formMapper";
import { mailerOptions } from "../mailer/mailerOptions";
import { submissionMailer } from "../mailer/submissionMailer";
import { validateSubmission } from "../validator/validateSubmission";

async function sendCorsResponse(request: Request, response: Response) {
  return await cors(request, response);
}

export async function processSubmission<T>(
  request: Request,
  schema: Schema,
  sender: string,
  recipient: string,
  subject: string
) {
  let formData = await request.formData();

  let data = formMapper<T>(formData, schema);
  let errors = validateSubmission<T>(data, schema);

  if (errors.length === 0) {
    try {
      await submissionMailer<T>(
        mailerOptions,
        sender,
        recipient,
        subject,
        data
      );
    } catch (error) {
      return await sendCorsResponse(
        request,
        json(null, { statusText: "mailer Issue", status: 500 })
      );
    }

    return await sendCorsResponse(
      request,
      json(null, { statusText: "submitted" })
    );
  }

  return await sendCorsResponse(request, json(errors, { status: 400 }));
}
