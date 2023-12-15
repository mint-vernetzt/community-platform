import type { Asserts, InferType, StringSchema, TestContext } from "yup";
import { mixed, number, string, ValidationError } from "yup";
import type { AnyObject, OptionalObjectSchema } from "yup/lib/object";
import { format } from "date-fns";
import { json } from "@remix-run/server-runtime";

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
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
  error: "Deine Eingabe entspricht nicht dem Format einer Website URL.",
};

const socialValidation = {
  facebook: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?facebook.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines facebook Profils (facebook.com/<Nutzername>).",
  },
  linkedin: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?linkedin.com\/(in|company)\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines LinkedIn Profils (linkedin.com/in/<Nutzername> oder linkedin.com/company/<Nutzername>).",
  },
  twitter: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?twitter.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Twitter Profils (twitter.com/<Nutzername>).",
  },
  youtube: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?youtube.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Youtube Kanals (youtube.com/<Nutzername>).",
  },
  instagram: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?instagram.com\/.+$|^$/,
    error:
      "Deine Eingabe entspricht nicht dem Format eines Instagram Profils (instagram.com/<Nutzername>).",
  },
  xing: {
    match: /^(https?:\/\/)?([a-z0-9]+\.)?xing.com\/(profile|pages)\/.+$|^$/,
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
  let validUrl = url.trim();
  if (validUrl !== "" && validUrl.search(/^https?:\/\//) === -1) {
    validUrl = "https://" + validUrl;
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

export function greaterThanTimeOnSameDate(
  referenceTime: string,
  greaterTime: string,
  referenceStartDate: string,
  referenceEndDate: string,
  requiredMessage: string,
  greaterThanReferenceTimeMessage: string
) {
  return string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return undefined;
    })
    .required(requiredMessage)
    .test(
      "greaterThanReferenceTimeOnSameDate",
      greaterThanReferenceTimeMessage,
      (value: string | null | undefined, testContext: TestContext) => {
        if (
          testContext.parent[referenceTime] &&
          testContext.parent[greaterTime] &&
          testContext.parent[referenceEndDate] &&
          testContext.parent[referenceStartDate]
        ) {
          const greaterTimeArray = testContext.parent[greaterTime].split(":");
          const greaterTimeHours = parseInt(greaterTimeArray[0]);
          const greaterTimeMinutes = parseInt(greaterTimeArray[1]);
          const referenceTimeArray =
            testContext.parent[referenceTime].split(":");
          const referenceTimeHours = parseInt(referenceTimeArray[0]);
          const referenceTimeMinutes = parseInt(referenceTimeArray[1]);
          const referenceStartDateObject = new Date(
            testContext.parent[referenceStartDate]
          );
          const referenceEndDateObject = new Date(
            testContext.parent[referenceEndDate]
          );
          if (
            referenceStartDateObject.getFullYear() ===
              referenceEndDateObject.getFullYear() &&
            referenceStartDateObject.getMonth() ===
              referenceEndDateObject.getMonth() &&
            referenceStartDateObject.getDate() ===
              referenceEndDateObject.getDate()
          ) {
            if (referenceTimeHours === greaterTimeHours) {
              return referenceTimeMinutes > greaterTimeMinutes;
            } else {
              return referenceTimeHours > greaterTimeHours;
            }
          } else {
            return true;
          }
        } else {
          return true;
        }
      }
    );
}

export function greaterThanDate(
  referenceDate: string,
  greaterDate: string,
  requiredMessage: string,
  greaterThanReferenceDateMessage: string
) {
  return string()
    .transform((value) => {
      value = value.trim();
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return undefined;
    })
    .required(requiredMessage)
    .test(
      "greaterThanReferenceTimeOnSameDate",
      greaterThanReferenceDateMessage,
      (value: string | null | undefined, testContext: TestContext) => {
        if (
          testContext.parent[referenceDate] &&
          testContext.parent[greaterDate]
        ) {
          return (
            new Date(testContext.parent[referenceDate]).getTime() >=
            new Date(testContext.parent[greaterDate]).getTime()
          );
        } else {
          return true;
        }
      }
    );
}

export function participantLimit() {
  return mixed() // inspired by https://github.com/jquense/yup/issues/298#issue-353217237
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        value === 0 ||
        number().isValidSync(value)
      );
    })
    .when("participantCount", (participantCount, schema) =>
      participantCount
        ? schema.test(
            "lessThanParticipantCount",
            "Achtung! Es nehmen bereits mehr Personen teil als die aktuell eingestellte Teilnahmebegrenzung. Bitte zuerst die entsprechende Anzahl der Teilnehmenden zur Warteliste hinzufügen.",
            (participantLimit: string | null | undefined) => {
              if (
                !(
                  participantLimit === null ||
                  participantLimit === undefined ||
                  participantLimit === "" ||
                  participantLimit === "0"
                )
              ) {
                return participantLimit > participantCount;
              } else {
                return true;
              }
            }
          )
        : schema
    )
    .transform((value) => {
      return value === null || value === "" || value === "0"
        ? null
        : Number(value);
    })
    .nullable();
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
      // TODO: can this type assertion be removed and proofen by code?
      parsedFormData[key] = formData.getAll(key) as string[];
    } else {
      // TODO: can this type assertion be removed and proofen by code?
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
    throw json({ message: "Validation failed" }, { status: 400 });
  }
  return { errors, data };
}
