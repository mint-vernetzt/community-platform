import { type Schema } from "jsonschema";
import { cors } from "remix-utils/cors";
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
  const formData = await request.formData();

  const data = formMapper<T>(formData, schema);
  const errors = validateSubmission<T>(data, schema);

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
