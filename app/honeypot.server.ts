import { Honeypot, SpamError } from "remix-utils/honeypot/server";

// ### Honeypot
// Simple bots that try to post our actions will fill each input in a form automatically. Thats where the honeypot comes in. It adds a hidden input to your forms and checks on the server if it was filled out. If it was filled out, you know that it was a bot that submitted the form and you can reject the request. You can also use a honeypot field that is visible but has a name that makes it unlikely for bots to fill it out, like "email2" or "phone2". The honeypot field is encrypted with the encryptionSeed and decrypted on the server to prevent bots from easily bypassing it by checking the HTML of the form.
// You have to call checkHoneypot() in every action function in your app and include the <HoneypotInputs /> (remix-utils) in your html forms. Don't forget to add a nonce if you're using strict CSP.

export const honeypot = new Honeypot({
  // Disable timestamp validation in test enviorment to prevent tests from failing due to honeypot timestamp expiration
  validFromFieldName: process.env.NODE_ENV === "test" ? null : undefined,
  encryptionSeed: process.env.SESSION_SECRET,
});

export async function checkHoneypot(formData: FormData) {
  try {
    await honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response("Form not submitted properly", { status: 400 });
    }
    throw error;
  }
}
