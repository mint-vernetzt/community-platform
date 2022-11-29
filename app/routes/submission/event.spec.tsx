import type { EventFormData } from "~/lib/submissions/forms/event/eventFormData";
import { submissionMailer } from "../../lib/submissions/mailer/submissionMailer";
import { action, loader } from "./event";
import * as eventSchema from "../../lib/submissions/forms/event/validation.schema.json";
import { mailerOptions } from "../../lib/submissions/mailer/mailerOptions";
import { testURL } from "~/lib/utils/tests";

jest.mock("../../lib/submissions/mailer/submissionMailer");

const path = "/submission/event";

const VALID_EVENT_SUBMISSION: EventFormData = {
  name: "The name",
  date: "1974-03-18",
  place: "The place",
  description: "The description",
  contact_name: "The title",
  contact_email: "name@domain.test",
  terms_accepted: "The terms_accepted",
};

const submitForm = async (data: EventFormData) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  const response: Response = await action({
    request: new Request(`${testURL}${path}`, {
      method: "POST",
      body: formData,
    }),
    params: {},
    context: {},
  });

  return response;
};

describe("GET to submission endpoint", () => {
  it("should return the news schema.json on GET", async () => {
    const response: Response = await loader({
      request: new Request(`${testURL}${path}`, {
        method: "GET",
      }),
      params: {},
      context: {},
    });

    const text = await response.text();
    expect(text).toStrictEqual(JSON.stringify(eventSchema));
  });
});

describe("Given valid form data", () => {
  it("should send a mail to the configured recipient with all data", async () => {
    process.env.SUBMISSION_SENDER = "sender@test.test";
    process.env.EVENTSUBMISSION_RECIPIENT = "receiver@test.test";
    process.env.EVENTSUBMISSION_SUBJECT = "Subject";

    let res = await submitForm(VALID_EVENT_SUBMISSION);

    expect(res.status).toBe(200);
    expect(res.statusText).toBe("submitted");

    expect(submissionMailer).toHaveBeenCalledWith(
      mailerOptions,
      "sender@test.test",
      "receiver@test.test",
      "Subject",
      VALID_EVENT_SUBMISSION
    );
  });
});

describe("Given invalid form data", () => {
  it("should return validation errors", async () => {
    let invalidEventSubmission = {
      ...VALID_EVENT_SUBMISSION,
      name: "",
      date: "wrong date format",
      contact_email: "wrong(at)email.test",
    };

    let res = await submitForm(invalidEventSubmission);

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toEqual([
      { field: "name", rule: "minLength" },
      { field: "date", rule: "format" },
      { field: "contact_email", rule: "format" },
    ]);
  });
});
