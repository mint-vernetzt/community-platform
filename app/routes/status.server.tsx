import { LocalFileStorage } from "@mjackson/file-storage/local";
import { type FileUpload } from "@mjackson/form-data-parser";
import { FILE_FIELD_NAME } from "~/form-helpers";
import { invariantResponse } from "~/lib/utils/response";

export async function* streamToAsyncIterator(
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>
) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } catch (error) {
    invariantResponse(false, "Server Error", { status: 500 });
  } finally {
    reader.releaseLock();
  }
}

export const fileStorage = new LocalFileStorage(`temporary-upload-storage`);

export async function uploadHandler(fileUpload: FileUpload) {
  if (fileUpload.fieldName === FILE_FIELD_NAME) {
    // FileUpload objects are not meant to stick around for very long (they are
    // streaming data from the request.body!) so we should store them as soon as
    // possible.
    await fileStorage.set(fileUpload.fieldName, fileUpload);
    console.log("Setting temp file", fileUpload.fieldName);

    // Return a File for the FormData object. This is a LazyFile that knows how
    // to access the file's content if needed (using e.g. file.stream()) but
    // waits until it is requested to actually read anything.
    return fileStorage.get(fileUpload.fieldName);
  }
}

export async function deleteAllTemporaryFiles() {
  const items = await fileStorage.list(); // List all items in the fileStorage
  for (const file of items.files) {
    console.log("Removing temp file", file.key);
    await fileStorage.remove(file.key); // Delete each item by its name
  }
  console.log("All temporary files have been deleted.");
}
