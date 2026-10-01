import {
  type AnyObject,
  type InferType,
  type ObjectSchema,
  type StringSchema,
  ValidationError,
  string,
} from "yup";
import { removeHtmlTags, replaceHtmlEntities } from "./transformHtml";

type Error = {
  type: string;
  message: string;
};

export type FormError = {
  [key: string]: {
    message: string;
    errors?: Error[];
  };
};

const phoneValidation = {
  match: /^$|^(\+?[0-9\s-()]{3,}\/?[0-9\s-()]{4,})$/,
  error:
    "Bitte gib eine gültige Telefonnummer ein (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, )).",
};

const websiteValidation = {
  match:
    // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
    /^(https?:\/\/)?(www\.)?[\-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9\(\)]{1,9}\b([\-a-zA-Z0-9\(\)@:%_+.~#?&\/\/=]*)/gi,
  error:
    "Deine Eingabe entspricht nicht dem Format einer Webseiten URL https://domain.tld/...).",
};

const socialValidation = {
  facebook: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?facebook.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer facebook Seite (facebook.com/...).",
  },
  linkedin: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?linkedin.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer LinkedIn Seite (linkedin.com/...).",
  },
  twitter: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?twitter.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer X oder Twitter Seite (twitter.com/...).",
  },
  youtube: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?youtube.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer Youtube Seite (youtube.com/...).",
  },
  instagram: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?instagram.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer Instagram Seite (instagram.com/...).",
  },
  xing: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?xing.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer Xing Seite (xing.com/...).",
  },
  mastodon: {
    match:
      // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
      /^(https?:\/\/)?(www\.)?[\-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9\(\)]{1,9}\b([\-a-zA-Z0-9\(\)@:%_+.~#?&\/\/=]*)/gi,
    error:
      "Deine Eingabe entspricht nicht dem Format einer Mastodon Seite https://domain.tld/...).",
  },
  tiktok: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?tiktok.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format einer TikTok Seite (tiktok.com/...)",
  },
};

export const nullOrString = (schema: StringSchema) =>
  schema
    .transform((value: string | undefined) => {
      if (typeof value === "undefined" || value === "") {
        return null;
      }
      return value;
    })
    .nullable()
    .defined();

export function phone() {
  return string().trim().matches(phoneValidation.match, phoneValidation.error);
}

function addUrlPrefix(url: string | undefined) {
  if (typeof url === "undefined" || url === "") {
    return null;
  }
  let validUrl = url;
  if (validUrl !== "" && validUrl.search(/^https?:\/\//) === -1) {
    validUrl = "https://" + validUrl;
  }
  return validUrl;
}

export function website() {
  return string()
    .trim()
    .transform(addUrlPrefix)
    .matches(websiteValidation.match, websiteValidation.error);
}

export function social(service: keyof typeof socialValidation) {
  return string()
    .trim()
    .transform(addUrlPrefix)
    .matches(socialValidation[service].match, socialValidation[service].error);
}

export function multiline(maxLength: number) {
  return string()
    .trim()
    .test((value) => {
      return (
        replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
        maxLength
      );
    })
    .transform((value: string | undefined) => {
      if (typeof value === "undefined") {
        return null;
      }
      const trimmedRTEValue = value
        .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
        .trim();
      if (trimmedRTEValue === "") {
        return null;
      }
      return trimmedRTEValue;
    });
}

export async function getFormValues<T extends ObjectSchema<AnyObject>>(
  request: Request,
  schema: T
): Promise<InferType<T>> {
  const formData = await request.clone().formData();
  // TODO: Find better solution if this is not the best
  const parsedFormData: AnyObject = {};
  for (const key in schema.fields) {
    // @ts-ignore
    if (schema.fields[key].type === "array") {
      // TODO: can this type assertion be removed and proofen by code?
      parsedFormData[key] = formData.getAll(key) as string[];
    } else {
      // TODO: can this type assertion be removed and proofen by code?
      parsedFormData[key] = formData.get(key) as string;
    }
  }
  return parsedFormData;
}

export async function validateForm<T extends ObjectSchema<AnyObject>>(
  schema: T,
  parsedFormData: InferType<T>
): Promise<{
  data: InferType<T>;
  errors: FormError | null;
}> {
  let data: InferType<T> = parsedFormData;
  const errors: FormError = {};

  try {
    data = await schema.validate(parsedFormData, {
      abortEarly: false,
    });
    return { data, errors: null };
  } catch (validationError) {
    if (validationError instanceof ValidationError) {
      validationError.inner.forEach((validationError) => {
        if (validationError.path) {
          if (!errors[validationError.path]) {
            errors[validationError.path] = {
              message: validationError.message,
              errors: [],
            };
          } else {
            errors[validationError.path].message +=
              `, ${validationError.message}`;
          }

          errors[validationError.path].errors?.push({
            type: (validationError.type as string) ?? "",
            message: validationError.message,
          });
        }
      });
    } else {
      throw validationError;
    }
  }
  return { data, errors };
}
