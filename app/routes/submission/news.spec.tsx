import { NewsFormData } from "~/lib/submissions/forms/news/newsFormData";
import { submissionMailer } from "../../lib/submissions/mailer/submissionMailer";
import { action, loader } from "./news";
import * as newsSchema from "../../lib/submissions/forms/news/validation.schema.json";
import { mailerOptions } from "../../lib/submissions/mailer/mailerOptions";
import { testURL } from "~/lib/utils/tests";

jest.mock("../../lib/submissions/mailer/submissionMailer");

const path = "/submission/news";

const VALID_NEWS_SUBMISSION = {
  title: "The title",
  text: "The title",
  source: "The title",
  contact_name: "The title",
  contact_email: "name@domain.test",
  terms_accepted: "The terms_accepted",
};

const submitForm = async (data: NewsFormData) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  const response: Response = await action({
    request: new Request(`${testURL}/${path}`, {
      method: "POST",
      body: formData,
    }),
    params: {},
    context: {},
  });

  return response;
};

describe("GET to submission endpoint", () => {
  it.todo("should do something great");
  it("should return the news schema.json on GET", async () => {
    const response: Response = await loader({
      request: new Request(`${testURL}/${path}`, {
        method: "GET",
      }),
      params: {},
      context: {},
    });

    const text = await response.text();
    expect(text).toStrictEqual(JSON.stringify(newsSchema));
  });
});

describe("Given valid form data", () => {
  it("should send a mail to the configured recipient with all data", async () => {
    process.env.SUBMISSION_SENDER = "sender@test.test";
    process.env.NEWSSUBMISSION_RECIPIENT = "receiver@test.test";
    process.env.NEWSSUBMISSION_SUBJECT = "Subject";

    let res = await submitForm(VALID_NEWS_SUBMISSION);

    expect(res.statusText).toBe("submitted");

    expect(submissionMailer).toHaveBeenCalledWith(
      mailerOptions,
      "sender@test.test",
      "receiver@test.test",
      "Subject",
      VALID_NEWS_SUBMISSION
    );
  });

  it.skip("should return error when mailer throws", async () => {
    let res = await submitForm(VALID_NEWS_SUBMISSION);

    expect(res.status).toBe(500);
  });
});

describe("Given invalid form data", () => {
  it("should return validation errors", async () => {
    let invalidNewsSubmission = {
      ...VALID_NEWS_SUBMISSION,
      title: "",
      contact_email: "wrong(at)email.test",
    };

    let res = await submitForm(invalidNewsSubmission);

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toEqual([
      { field: "title", rule: "minLength" },
      { field: "contact_email", rule: "format" },
    ]);
  });
});
