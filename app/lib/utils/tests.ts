import {
  Request as NodeRequest,
  FormData as NodeFormData,
} from "@remix-run/web-fetch";

export const testURL = "https://test.com";

export function createRequestWithFormData(keyValuePairs: {
  [key: string]: string | string[];
}) {
  const formData = new NodeFormData();
  for (let key in keyValuePairs) {
    if (Array.isArray(keyValuePairs[key])) {
      (keyValuePairs[key] as string[]).forEach((item) => {
        formData.set(key, item);
      });
    } else {
      formData.set(key, keyValuePairs[key] as string);
    }
  }
  const request = new NodeRequest(testURL, {
    method: "post",
    body: formData,
  });
  return request;
}
