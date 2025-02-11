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
