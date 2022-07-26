import { InferType, string, ValidationError } from "yup";
import { AnyObject, OptionalObjectSchema } from "yup/lib/object";

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

// TODO: find better place

const phoneValidation = {
  match: /^$|^(\+?[0-9\s-\(\)]{3,}\/?[0-9\s-\(\)]{4,})$/,
  error:
    "Deine Eingabe entspricht nicht dem Format einer Telefonnummer (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, )).",
};

const websiteValidation = {
  match:
    /(https?:\/\/)?(www\.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$|^$/,
  error: "Deine Eingabe entspricht nicht dem Format einer Website URL.",
};
const socialValidation = {
  facebook: {
    match: /(https?:\/\/)?(.*\.)?facebook.com\/.+\/?$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines facebook Profils (facebook.com/<Nutzername>).",
  },
  linkedin: {
    match: /(https?:\/\/)?(.*\.)?linkedin.com\/company\/.+\/?$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines LinkedIn Profils (https://www.linkedin.com/company/<Nutzername>).",
  },
  twitter: {
    match: /(https?:\/\/)?(.*\.)?twitter.com\/.+\/?$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Twitter Profils (twitter.com/<Nutzername>).",
  },
  xing: {
    match: /(https?:\/\/)?(.*\.)?xing.com\/pages\/.+\/?$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Xing Profils (xing.com/pages/<Nutzername>).",
  },
};

export function phone() {
  return string().matches(phoneValidation.match, phoneValidation.error);
}

export function website() {
  return string()
    .transform(addUrlPrefix)
    .matches(websiteValidation.match, websiteValidation.error);
}

export function social(service: keyof typeof socialValidation) {
  return string()
    .transform(addUrlPrefix)
    .matches(socialValidation[service].match, socialValidation[service].error);
}

export function bio() {
  return string().transform(removeMoreThan2ConsecutiveLineBreaks);
}

function addUrlPrefix(url: string) {
  let validUrl = url;
  if (url !== "" && url.search(/^https?:\/\//) === -1) {
    validUrl = "https://" + url;
  }
  return validUrl;
}

function removeMoreThan2ConsecutiveLineBreaks(string: string) {
  return string.replace(/(\r\n|\n|\r){3,}/gm, "\n\n");
}

// TODO: Find better place (outsource)
export async function getFormValues<T extends OptionalObjectSchema<AnyObject>>(
  request: Request,
  schema: T
): Promise<InferType<T>> {
  const formData = await request.clone().formData();
  // TODO: Find better solution if this is not the best
  let values: AnyObject = {};
  for (const key in schema.fields) {
    if (schema.fields[key].type === "array") {
      values[key] = formData.getAll(key) as string[];
    } else {
      values[key] = formData.get(key) as string;
    }
  }
  return values;
}

// TODO: find better place (outsource)
export async function validateForm(
  schema: OptionalObjectSchema<AnyObject>,
  parsedFormData: InferType<OptionalObjectSchema<AnyObject>>
) {
  let errors: FormError = {};

  try {
    await schema.validate(parsedFormData, { abortEarly: false });
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
            errors[
              validationError.path
            ].message += `, ${validationError.message}`;
          }

          errors[validationError.path].errors?.push({
            type: (validationError.type as string) ?? "",
            message: validationError.message,
          });
        }
      });
    }
  }

  return Object.keys(errors).length === 0 ? false : errors;
}
