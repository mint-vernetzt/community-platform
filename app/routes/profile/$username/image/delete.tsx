import { ActionFunction } from "remix";
import { makeDomainFunction } from "remix-domains";
import { formAction } from "remix-forms";
import { notFound } from "remix-utils";
import { z } from "zod";
import { handleAuthorization } from "~/lib/auth/handleAuth";
import { getProfileByUsername } from "~/profile.server";
import {
  removeImageFromProfile,
  removeImageFromStorage,
} from "./delete.server";

// import { validateCSRFToken } from "~/utils.server";

export const uploadKeys = z.enum(["avatar", "background"]);
export const schema = z.object({
  username: z.string().min(1),
  uploadKey: uploadKeys,
  csrf: z.string().min(1),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileByUsername(values.username);
  if (profile === null) {
    throw notFound({ message: "Profile Not found" });
  }

  const imagePathToDelete = profile[values.uploadKey];
  if (imagePathToDelete) {
    const success = await removeImageFromStorage(imagePathToDelete);
    if (success) {
      removeImageFromProfile(profile.id, values.uploadKey);
    }

    return { success };
  }

  return { success: true, message: "nothing to do." };
});

export const action: ActionFunction = async ({ request, params }) => {
  handleAuthorization(request, params.username ?? "");

  // TODO: CSRF -> await validateCSRFToken(clonedRequest);

  return formAction({
    request,
    schema,
    mutation,
    successPath: `/profile/${params.username}`,
  });
};
