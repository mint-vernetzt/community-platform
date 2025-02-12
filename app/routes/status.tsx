// import { redirect } from "@remix-run/node";

import { Form } from "@remix-run/react";
import { type ActionFunctionArgs } from "@remix-run/server-runtime";
import { Readable } from "stream";
import { invariantResponse } from "~/lib/utils/response";
import { streamToAsyncIterator } from "./status.server";
import { fileTypeFromBlob } from "file-type";
import { nextGeneratePathName } from "~/storage.server";
import { createHashFromString } from "~/utils.server";
import { createAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";

export const loader = async () => {
  // return redirect("/");
  return { messsage: "The Server is up and running" };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariantResponse(intent === "documents", "Bad request - Wrong intent", {
    status: 400,
  });
  const file = formData.get("file");
  invariantResponse(file !== null, "Bad request - No file", { status: 400 });
  console.log(file.constructor.name);
  const isFile = file instanceof File;
  const isBlob = file instanceof Blob;
  invariantResponse(isFile || isBlob, "Not a File or Blob", { status: 400 });
  const fileType = await fileTypeFromBlob(file);
  invariantResponse(
    typeof fileType !== "undefined",
    "Bad request - File type undefined",
    {
      status: 400,
    }
  );
  invariantResponse(
    fileType.mime === "application/pdf",
    "Bad request - Incorrect mime",
    {
      status: 400,
    }
  );
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
        <button type="submit" name="intent" value="documents">
          Submit
        </button>
      </Form>
    </>
  );
}
