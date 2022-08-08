import { PassThrough } from "stream";

function createFormDataEntry(args: {
  key: string;
  value: string;
  boundary: string;
}) {
  const { key, value, boundary } = args;
  const arr = [`--${boundary}`];
  arr.push(`Content-Disposition: form-data; name="${key}"`);
  arr.push("");
  arr.push(value);
  return arr;
}

export function createRequestWithFormData(keyValuePairs: {
  [key: string]: string | string[];
}) {
  const boundary = "test";

  const content: string[] = Object.entries(keyValuePairs).reduce(
    (acc: string[], cur) => {
      const [key, value] = cur;

      let arr: string[] = [];

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          arr = arr.concat(
            createFormDataEntry({ key, value: entry, boundary })
          );
        });
      } else {
        arr = arr.concat(createFormDataEntry({ key, value, boundary }));
      }
      return acc.concat(arr);
    },
    []
  );

  const source = [content.concat(`--${boundary}--`).join("\r\n")];
  let body = new PassThrough();
  source.forEach((chunk) => body.write(chunk));
  body.end();

  const headers = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
  };

  const request = new Request("", { method: "POST", body, headers }); // TODO: investigate type issue

  return request;
}
