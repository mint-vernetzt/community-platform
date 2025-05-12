import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Dropdown } from "~/components-next/Dropdown";
import { FormControl } from "~/components-next/FormControl";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { checkboxSchema } from "~/lib/utils/schemas";
import { languageModuleMap } from "~/locales/.server";
import { register, type RegisterLocales } from "./index.server";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { HidePassword } from "~/components-next/icons/HidePassword";
import { ShowPassword } from "~/components-next/icons/ShowPassword";

export const createRegisterSchema = (locales: RegisterLocales) => {
  return z.object({
    academicTitle: z
      .enum([
        locales.form.title.options.none,
        locales.form.title.options.dr,
        locales.form.title.options.prof,
        locales.form.title.options.profdr,
      ])
      .optional()
      .transform((value) => {
        if (
          typeof value === "undefined" ||
          value === locales.form.title.options.none
        ) {
          return null;
        }
        return value;
      }),
    firstName: z.string({
      message: locales.validation.firstName,
    }),
    lastName: z.string({
      message: locales.validation.lastName,
    }),
    email: z
      .string({
        message: locales.validation.email,
      })
      .email(locales.validation.email),
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    termsAccepted: checkboxSchema,
    loginRedirect: z.string().optional(),
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  return { locales, currentTimestamp: Date.now() };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  // Conform
  const formData = await request.formData();
  const { submission } = await register({
    formData,
    authClient,
    locales,
  });

  return {
    submission: submission.reply(),
    email: submission.status === "success" ? submission.value.email : null,
    systemMail: process.env.SYSTEM_MAIL_SENDER,
    supportMail: process.env.SUPPORT_MAIL,
    currentTimestamp: Date.now(),
  };
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const [showPassword, setShowPassword] = useState(false);

  const [registerForm, registerFields] = useForm({
    id: `register-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(createRegisterSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createRegisterSchema(locales).transform((data, ctx) => {
          if (data.termsAccepted === false) {
            ctx.addIssue({
              code: "custom",
              message: locales.validation.termsAccepted,
              path: ["termsAccepted"],
            });
            return z.NEVER;
          }
          return { ...data };
        }),
      });
      return submission;
    },
  });

  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative mv-z-10">
      <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
        <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
          <div className="mv-mb-6 mv-mt-12">
            {locales.content.question}{" "}
            <Link
              to={`/login${
                loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
              }`}
              className="mv-text-primary mv-font-bold"
            >
              {locales.content.login}
            </Link>
          </div>
          <h1 className="mv-mb-8">{locales.content.create}</h1>
          {typeof actionData !== "undefined" &&
          typeof actionData.submission.status !== "undefined" &&
          actionData.submission.status === "success" ? (
            <>
              <p className="mv-mb-4">
                {insertComponentsIntoLocale(
                  insertParametersIntoLocale(locales.content.success, {
                    email: actionData.email,
                    systemMail: actionData.systemMail,
                  }),
                  [
                    <span key="email-highlight" className="mv-font-semibold" />,
                    <a
                      key="support-mail-link"
                      href={`mailto:${actionData.supportMail}`}
                      className="mv-text-primary mv-font-semibold hover:mv-underline"
                    >
                      {" "}
                    </a>,
                  ]
                )}{" "}
                <Link
                  to={`/reset${
                    loginRedirect !== null
                      ? `?login_redirect=${loginRedirect}`
                      : ""
                  }`}
                  className="mv-text-primary mv-font-bold hover:mv-underline"
                >
                  {locales.content.reset}
                </Link>
                .
              </p>
            </>
          ) : (
            <Form
              {...getFormProps(registerForm)}
              method="post"
              preventScrollReset
              autoComplete="off"
            >
              <p className="mv-mb-4">{locales.form.intro}</p>
              <div className="mv-flex mv-flex-row mv-mb-4">
                <div className="mv-basis-full @lg:mv-basis-1/2">
                  <Dropdown>
                    <Dropdown.Label>
                      {isHydrated === true &&
                      typeof registerFields.academicTitle.value !== "undefined"
                        ? registerFields.academicTitle.value
                        : locales.form.title.label}
                    </Dropdown.Label>
                    <Dropdown.List>
                      {Object.entries(locales.form.title.options).map(
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ([_key, title]) => {
                          return (
                            <FormControl
                              {...getInputProps(registerFields.academicTitle, {
                                type: "radio",
                                value: title,
                              })}
                              key={title}
                            >
                              <FormControl.Label>{title}</FormControl.Label>
                            </FormControl>
                          );
                        }
                      )}
                    </Dropdown.List>
                  </Dropdown>
                  {typeof registerFields.academicTitle.errors !== "undefined" &&
                  registerFields.academicTitle.errors.length > 0 ? (
                    <div className="mv-mb-10">
                      {registerFields.academicTitle.errors.map(
                        (error, index) => {
                          return (
                            <div
                              id={registerFields.academicTitle.errorId}
                              key={index}
                              className="mv-text-sm mv-font-semibold mv-text-negative-600"
                            >
                              {error}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mv-flex mv-flex-col @lg:mv-flex-row mv-mb-4 mv-gap-4">
                <Input
                  {...getInputProps(registerFields.firstName, {
                    type: "text",
                  })}
                  key="firstName"
                >
                  <Input.Label htmlFor={registerFields.firstName.id}>
                    {locales.form.firstName}
                  </Input.Label>
                  {typeof registerFields.firstName.errors !== "undefined" &&
                  registerFields.firstName.errors.length > 0
                    ? registerFields.firstName.errors.map((error) => (
                        <Input.Error
                          id={registerFields.firstName.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
                <Input
                  {...getInputProps(registerFields.lastName, {
                    type: "text",
                  })}
                  key="lastName"
                >
                  <Input.Label htmlFor={registerFields.lastName.id}>
                    {locales.form.lastName}
                  </Input.Label>
                  {typeof registerFields.lastName.errors !== "undefined" &&
                  registerFields.lastName.errors.length > 0
                    ? registerFields.lastName.errors.map((error) => (
                        <Input.Error
                          id={registerFields.lastName.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="mv-mb-4">
                <Input
                  {...getInputProps(registerFields.email, { type: "text" })}
                  key="email"
                >
                  <Input.Label htmlFor={registerFields.email.id}>
                    {locales.form.email}
                  </Input.Label>
                  {typeof registerFields.email.errors !== "undefined" &&
                  registerFields.email.errors.length > 0
                    ? registerFields.email.errors.map((error) => (
                        <Input.Error
                          id={registerFields.email.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="mv-mb-4">
                <Input
                  {...getInputProps(registerFields.password, {
                    type: showPassword ? "text" : "password",
                  })}
                  key="password"
                >
                  <Input.Label htmlFor={registerFields.password.id}>
                    {locales.form.password.label}
                  </Input.Label>
                  {typeof registerFields.password.errors !== "undefined" &&
                  registerFields.password.errors.length > 0
                    ? registerFields.password.errors.map((error) => (
                        <Input.Error
                          id={registerFields.password.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                  {isHydrated === true ? (
                    <Input.Controls>
                      <div className="mv-h-10 mv-w-10">
                        <CircleButton
                          type="button"
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          variant="outline"
                          fullSize
                          aria-label={
                            showPassword
                              ? locales.form.password.hidePassword
                              : locales.form.password.showPassword
                          }
                        >
                          {showPassword ? <HidePassword /> : <ShowPassword />}
                        </CircleButton>
                      </div>
                    </Input.Controls>
                  ) : null}
                </Input>
              </div>
              <div className="mv-mb-10 -mv-ml-5">
                <FormControl
                  {...getInputProps(registerFields.termsAccepted, {
                    type: "checkbox",
                  })}
                  key="termsAccepted"
                  labelPosition="right"
                >
                  <FormControl.Label>
                    <div className="mv-pl-2">
                      {insertComponentsIntoLocale(locales.form.confirmation, [
                        <a
                          key="terms-of-use-confirmation"
                          href="https://mint-vernetzt.de/terms-of-use-community-platform"
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mv-text-primary mv-font-semibold hover:mv-underline"
                        >
                          {" "}
                        </a>,
                        <a
                          key="privacy-policy-confirmation"
                          href="https://mint-vernetzt.de/privacy-policy-community-platform"
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mv-text-primary mv-font-semibold hover:mv-underline"
                        >
                          {" "}
                        </a>,
                      ])}
                    </div>
                  </FormControl.Label>
                </FormControl>
                {typeof registerFields.termsAccepted.errors !== "undefined" &&
                registerFields.termsAccepted.errors.length > 0 ? (
                  <div className="mv-mb-10 mv-ml-5">
                    {registerFields.termsAccepted.errors.map((error, index) => {
                      return (
                        <div
                          id={registerFields.termsAccepted.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {typeof registerForm.errors !== "undefined" &&
              registerForm.errors.length > 0 ? (
                <div className="mv-mb-10">
                  {registerForm.errors.map((error, index) => {
                    return (
                      <div
                        id={registerForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <input
                {...getInputProps(registerFields.loginRedirect, {
                  type: "hidden",
                })}
                key="loginRedirect"
              />
              <div className="mv-flex mv-flex-row mv-mb-8 mv-items-center mv-justify-end">
                <Button
                  type="submit"
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? registerForm.dirty === false ||
                        registerForm.valid === false
                      : false
                  }
                >
                  {locales.form.submit}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

// function Old() {
//   const { locales } = useLoaderData<typeof loader>();
//   const actionData = useActionData<typeof action>();
//   const [urlSearchParams] = useSearchParams();
//   const loginRedirect = urlSearchParams.get("login_redirect");
//   const submit = useSubmit();
//   const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
//     if (event.key === "Enter") {
//       event.preventDefault();
//       // TODO: fix type issue
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       if (event.target.getAttribute("name") !== "termsAccepted") {
//         submit(event.currentTarget);
//       }
//     }
//   };
//   const schema = createSchema(locales);

//   return (
//     <>
//       <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
//         <div className="flex flex-col mv-w-full mv-items-center">
//           <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
//             <div className="mv-mb-6 mv-mt-12">
//               {locales.content.question}{" "}
//               <Link
//                 to={`/login${
//                   loginRedirect ? `?login_redirect=${loginRedirect}` : ""
//                 }`}
//                 className="text-primary font-bold"
//               >
//                 {locales.content.login}
//               </Link>
//             </div>
//             <h1 className="mb-4">{locales.content.create}</h1>
//             {actionData !== undefined && actionData.success ? (
//               <>
//                 <div className="mb-4">
//                   <RichText
//                     html={insertParametersIntoLocale(locales.content.success, {
//                       email: actionData.data.email,
//                     })}
//                   />{" "}
//                   <Link
//                     to={`/reset${
//                       loginRedirect ? `?login_redirect=${loginRedirect}` : ""
//                     }`}
//                     className="text-primary font-bold hover:underline"
//                   >
//                     {locales.content.reset}
//                   </Link>
//                   .
//                 </div>
//               </>
//             ) : (
//               <RemixFormsForm
//                 method="post"
//                 schema={schema}
//                 onKeyDown={handleKeyPress}
//               >
//                 {({ Field, Errors, register }) => (
//                   <>
//                     <p className="mb-4">{locales.form.intro}</p>
//                     <div className="flex flex-row -mx-4 mb-4">
//                       <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
//                         <input
//                           name="loginRedirect"
//                           defaultValue={loginRedirect || undefined}
//                           hidden
//                         />
//                         <Field name="academicTitle" label="Titel">
//                           {({ Errors }) => (
//                             <>
//                               <SelectField
//                                 label={locales.form.title.label}
//                                 options={[
//                                   {
//                                     label: locales.form.title.options.dr,
//                                     value: "Dr.",
//                                   },
//                                   {
//                                     label: locales.form.title.options.prof,
//                                     value: "Prof.",
//                                   },
//                                   {
//                                     label: locales.form.title.options.profdr,
//                                     value: "Prof. Dr.",
//                                   },
//                                 ]}
//                                 {...register("academicTitle")}
//                               />
//                               <Errors />
//                             </>
//                           )}
//                         </Field>
//                       </div>
//                     </div>

//                     <div className="flex flex-col @lg:mv-flex-row -mx-4 mb-4">
//                       <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
//                         <Field name="firstName" label="Vorname">
//                           {({ Errors }) => (
//                             <>
//                               <Input
//                                 id="firstName"
//                                 label={locales.form.firstName}
//                                 required
//                                 {...register("firstName")}
//                               />

//                               <Errors />
//                             </>
//                           )}
//                         </Field>
//                       </div>
//                       <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
//                         <Field name="lastName" label="Nachname">
//                           {({ Errors }) => (
//                             <>
//                               <Input
//                                 id="lastName"
//                                 label={locales.form.lastName}
//                                 required
//                                 {...register("lastName")}
//                               />
//                               <Errors />
//                             </>
//                           )}
//                         </Field>
//                       </div>
//                     </div>

//                     <div className="mb-4">
//                       <Field name="email" label="E-Mail">
//                         {({ Errors }) => (
//                           <>
//                             <Input
//                               id="email"
//                               label={locales.form.email}
//                               required
//                               {...register("email")}
//                             />
//                             <Errors />
//                           </>
//                         )}
//                       </Field>
//                     </div>

//                     <div className="mb-4">
//                       <Field name="password" label="Passwort">
//                         {({ Errors }) => (
//                           <>
//                             <InputPassword
//                               id="password"
//                               label={locales.form.password}
//                               required
//                               {...register("password")}
//                             />
//                             <Errors />
//                           </>
//                         )}
//                       </Field>
//                     </div>

//                     {/* <div className="mb-4">
//               <InputPassword id="" label="Passwort wiederholen" isRequired />
//             </div> */}

//                     <div className="mb-8">
//                       <div className="form-control checkbox-privacy items-start">
//                         <label className="label cursor-pointer items-start">
//                           <Field name="termsAccepted">
//                             {({ Errors }) => {
//                               const ForwardRefComponent = forwardRef<
//                                 HTMLInputElement,
//                                 React.DetailedHTMLProps<
//                                   React.InputHTMLAttributes<HTMLInputElement>,
//                                   HTMLInputElement
//                                 >
//                               >((props, ref) => {
//                                 return (
//                                   <>
//                                     <input
//                                       ref={
//                                         // TODO: can this type assertion be removed and proofen by code?
//                                         ref as React.RefObject<HTMLInputElement>
//                                       }
//                                       {...props}
//                                     />
//                                   </>
//                                 );
//                               });
//                               ForwardRefComponent.displayName =
//                                 "ForwardRefComponent";
//                               return (
//                                 <>
//                                   <ForwardRefComponent
//                                     type="checkbox"
//                                     className="checkbox checkbox-primary mr-4"
//                                     {...register("termsAccepted")}
//                                   />
//                                   <Errors />
//                                 </>
//                               );
//                             }}
//                           </Field>
//                           <span className="label-text">
//                             {locales.form.acknowledgements.intro}{" "}
//                             <a
//                               href="https://mint-vernetzt.de/terms-of-use-community-platform"
//                               target="_blank"
//                               rel="noreferrer noopener"
//                               className="text-primary font-bold hover:underline"
//                             >
//                               {locales.form.acknowledgements.termsOfUse}
//                             </a>
//                             {locales.form.acknowledgements.bridge}{" "}
//                             <a
//                               href="https://mint-vernetzt.de/privacy-policy-community-platform"
//                               target="_blank"
//                               rel="noreferrer noopener"
//                               className="text-primary font-bold hover:underline"
//                             >
//                               {locales.form.acknowledgements.dataProtection}
//                             </a>{" "}
//                             {locales.form.acknowledgements.outro}
//                           </span>
//                         </label>
//                       </div>
//                     </div>
//                     <div className="mb-8">
//                       <button type="submit" className="btn btn-primary">
//                         {locales.form.submit}
//                       </button>
//                     </div>
//                     <Errors />
//                   </>
//                 )}
//               </RemixFormsForm>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
