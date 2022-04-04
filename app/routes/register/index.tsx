import { ActionFunction, Form, json, LoaderFunction } from "remix";
import { signUp } from "../../auth.server";
import { prismaClient } from "../../prisma";
import { badRequest, generateUsername, validateFormData } from "../../utils";

export const loader: LoaderFunction = async (args) => {
  return null;
};

// TODO: Error handling and passing
export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return badRequest();
  }

  const isFormDataValid = validateFormData(
    ["email", "password", "firstName", "lastName", "termsAccepted"],
    formData
  );

  if (!isFormDataValid) {
    console.error("form data not valid");
    return badRequest(); // TODO: return empty fields to highlight
  }

  const termsAccepted = formData.get("termsAccepted");
  if (termsAccepted !== "on") {
    console.error("terms not accepted");
    return badRequest(); // TODO: return message e.g. "accepting terms are required"
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const academicTitle = formData.get("academicTitle") as string;

  // TODO: move to database trigger
  const numberOfProfilesWithSameName = await prismaClient.profile.count({
    where: { firstName, lastName },
  });
  const username = `${generateUsername(firstName, lastName)}${
    numberOfProfilesWithSameName > 0
      ? numberOfProfilesWithSameName.toString()
      : ""
  }`;

  const { user, session, error } = await signUp(email, password, {
    firstName,
    lastName,
    username,
    academicTitle,
    termsAccepted,
  });

  if (error) {
    console.error(error);
    return badRequest(); // TODO: handle and pass error
  }
  return json({ user, session });
};

export default function Index() {
  return (
    <Form method="post">
      <label htmlFor="academicTitle">Titel</label>
      <select id="academicTitle" name="academicTitle">
        <option value=""></option>
        <option value="Dr.">Dr.</option>
        <option value="Dr. Dr.">Dr. Dr.</option>
        <option value="Prof.">Prof.</option>
        <option value="Prof. Dr.">Prof. Dr.</option>
        <option value="Prof. Dr. Dr.">Prof. Dr. Dr.</option>
      </select>
      <label htmlFor="firstName">Vorname</label>
      <input type="text" id="firstName" name="firstName" />
      <label htmlFor="lastName">Nachname</label>
      <input type="text" id="lastName" name="lastName" />
      <label htmlFor="email">E-Mail</label>
      <input type="email" id="email" name="email" />
      <label htmlFor="password">Password</label>
      <input type="password" id="password" name="password" />
      <label htmlFor="termsAccepted">I accept terms and conditions</label>
      <input type="checkbox" id="termsAccepted" name="termsAccepted" />
      <button type="submit">Submit</button>
    </Form>
  );
}
