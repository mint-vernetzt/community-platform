import {
  Request as NodeRequest,
  FormData as NodeFormData,
} from "@remix-run/web-fetch";

export const testURL = "https://test.com";

export const abuseReportTestUrl = "http://localhost:3000/create-abuse-report";

export function createRequestWithFormData(keyValuePairs: {
  [key: string]: string | string[];
}) {
  const formData = new NodeFormData();
  for (const key in keyValuePairs) {
    if (Array.isArray(keyValuePairs[key])) {
      // TODO: can this type assertion be removed and proofen by code?
      (keyValuePairs[key] as string[]).forEach((item) => {
        formData.set(key, item);
      });
    } else {
      // TODO: can this type assertion be removed and proofen by code?
      formData.set(key, keyValuePairs[key] as string);
    }
  }
  const request = new NodeRequest(testURL, {
    method: "post",
    body: formData,
  });
  return request;
}
