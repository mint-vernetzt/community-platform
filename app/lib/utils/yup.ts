import { badRequest } from "remix-utils";
import { Asserts, InferType, string, StringSchema, ValidationError } from "yup";
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

const phoneValidation = {
  match: /^$|^(\+?[0-9\s-()]{3,}\/?[0-9\s-()]{4,})$/,
  error:
    "Bitte gib eine gültige Telefonnummer ein (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, )).",
};

const websiteValidation = {
  match:
    /(https?:\/\/)?(www\.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$|^$/,
  error: "Deine Eingabe entspricht nicht dem Format einer Website URL.",
};

const socialValidation = {
  facebook: {
    match: /(https?:\/\/)?(.*\.)?facebook.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines facebook Profils (facebook.com/<Nutzername>).",
  },
  linkedin: {
    match: /(https?:\/\/)?(.*\.)?linkedin.com\/(in|company)\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines LinkedIn Profils (linkedin.com/in/<Nutzername> oder linkedin.com/company/<Nutzername>).",
  },
  twitter: {
    match: /(https?:\/\/)?(.*\.)?twitter.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Twitter Profils (twitter.com/<Nutzername>).",
  },
  youtube: {
    match: /(https?:\/\/)?(.*\.)?youtube.com\/channel\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Youtube Kanals (youtube.com/channel/<Nutzername>).",
  },
  instagram: {
    match: /(https?:\/\/)?(.*\.)?instagram.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Instagram Profils (instagram.com/<Nutzername>).",
  },
  xing: {
    match: /(https?:\/\/)?(.*\.)?xing.com\/(profile|pages)\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Xing Profils (xing.com/profile/<Nutzername> oder xing.com/pages/<Nutzername>).",
  },
};

export const nullOrString = (schema: StringSchema) =>
  schema
    .transform((value: string) => (value === "" ? null : value))
    .nullable()
    .defined();

export function phone() {
  return string().matches(phoneValidation.match, phoneValidation.error);
}

function addUrlPrefix(url: string) {
  let validUrl = url;
  if (url !== "" && url.search(/^https?:\/\//) === -1) {
    validUrl = "https://" + url;
  }
  return validUrl;
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

function removeMoreThan2ConsecutiveLineBreaks(string: string) {
  return string.replace(/(\r\n|\n|\r){3,}/gm, "\n\n");
}

export function multiline() {
  return string().transform(removeMoreThan2ConsecutiveLineBreaks);
}

export async function getFormValues<T extends OptionalObjectSchema<AnyObject>>(
  request: Request,
  schema: T
): Promise<InferType<T>> {
  const formData = await request.clone().formData();
  // TODO: Find better solution if this is not the best
  let parsedFormData: AnyObject = {};
  for (const key in schema.fields) {
    if (schema.fields[key].type === "array") {
      parsedFormData[key] = formData.getAll(key) as string[];
    } else {
      parsedFormData[key] = formData.get(key) as string;
    }
  }
  return parsedFormData;
}

export async function validateForm<T extends OptionalObjectSchema<AnyObject>>(
  schema: T,
  parsedFormData: InferType<T>
): Promise<{
  data: InferType<T>;
  errors: FormError | null;
}> {
  let data: InferType<T> = parsedFormData;
  let errors: FormError = {};

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
    } else {
      throw validationError;
    }
  }
  return { data, errors };
}

export async function getFormDataValidationResultOrThrow<
  T extends OptionalObjectSchema<AnyObject>
>(request: Request, schema: T) {
  let parsedFormData = await getFormValues<T>(request, schema);

  let errors: FormError | null;
  let data: Asserts<T>;

  try {
    const result = await validateForm<T>(schema, parsedFormData);

    errors = result.errors;
    data = result.data;
  } catch (error) {
    console.error(error);
    throw badRequest({ message: "Validation failed" });
  }
  return { errors, data };
}
