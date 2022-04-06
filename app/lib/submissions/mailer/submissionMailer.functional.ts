import { submissionMailer } from "./submissionMailer";
import mailhog from "mailhog";

describe("mail delivery", () => {
  let mh = mailhog({
    host: "127.0.0.1",
  });

  beforeEach(async () => {
    await mh.deleteAll();
  });

  it("should deliver email to recipient", async () => {
    await submissionMailer(
      { host: "127.0.0.1", port: 1025 },
      "sender@domain.test",
      "recipient@domain.test",
      "Subjectline",
      { Titel: "Neue News" }
    );

    const messages = await mh.messages();
    expect(messages?.items).toHaveLength(1);
    expect(messages?.items[0].from).toEqual("sender@domain.test");
    expect(messages?.items[0].to).toEqual("recipient@domain.test");
    expect(messages?.items[0].subject).toBe("Subjectline");
    expect(messages?.items[0].text).toContain("TITEL: Neue News");
  });

  it("should throw when mailer fails", async () => {
    await expect(
      submissionMailer(
        { host: "127.0.0.1", port: 9999 },
        "sender@domain.test",
        "recipient@domain.test",
        "Subjectline",
        { Titel: "Neue News" }
      )
    ).rejects.toThrow();

    const messages = await mh.messages();
    expect(messages?.items).toHaveLength(0);
  });
});
