// import { redirect } from "@remix-run/node";

import { Form } from "@remix-run/react";
import { type ActionFunctionArgs } from "@remix-run/server-runtime";
import { Readable } from "stream";
import { invariantResponse } from "~/lib/utils/response";
import {
  deleteAllTemporaryFiles,
  streamToAsyncIterator,
  uploadHandler,
} from "./status.server";
import { fileTypeFromBlob } from "file-type";
import { nextGeneratePathName } from "~/storage.server";
import { createHashFromString } from "~/utils.server";
import { createAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { parseFormData } from "@mjackson/form-data-parser";

export const loader = async () => {
  // return redirect("/");
  return { messsage: "The Server is up and running" };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  let formData;
  try {
    formData = await parseFormData(request, uploadHandler);
  } catch (error) {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Server Error - Failed to parse multipart", {
      status: 500,
    });
  }
  const intent = formData.get("intent");
  if (intent !== "documents") {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - No intent", {
      status: 400,
    });
  }
  const file = formData.get("file");
  if (file === null || typeof file === "string") {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - Not a file", {
      status: 400,
    });
  }
  const fileType = await fileTypeFromBlob(file);
  if (typeof fileType === "undefined" || fileType.mime !== "application/pdf") {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - File type undefined or invalid", {
      status: 400,
    });
  }
  const path = nextGeneratePathName(
    createHashFromString(file.name),
    fileType.ext
  );
  const fileStream = Readable.from(streamToAsyncIterator(file.stream()));

  const { authClient } = await createAuthClient(request);
  const { data, error } = await authClient.storage
    .from(intent)
    .upload(path, fileStream, {
      upsert: true,
      contentType: fileType.mime,
      duplex: "half",
    });

  console.log({ data, error });

  await deleteAllTemporaryFiles();
  invariantResponse(error === null && data !== null, "Server Error", {
    status: 500,
  });

  const document = {
    filename: file.name,
    path: path,
    extension: fileType.ext,
    sizeInMB: Math.round((file.size / 1024 / 1024) * 100) / 100,
    mimeType: fileType.mime,
  };

  console.log({ document });

  await prismaClient.event.update({
    where: {
      // slug: "0_developerevent-m6f1c1tc",
      slug: "diemintwoche-l95trsmg",
    },
    data: {
      documents: {
        create: {
          document: {
            create: { ...document },
          },
        },
      },
      updatedAt: new Date(),
    },
  });

  return { message: "The Server is up and running" };
};

export default function Status() {
  return (
    <>
      <Form method="post" encType="multipart/form-data">
        <input type="file" name="file" />
        <input type="hidden" name="intent" value="documents" />
        <button type="submit">Submit</button>
      </Form>
    </>
  );
}
