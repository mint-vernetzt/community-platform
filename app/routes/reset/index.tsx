import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
  redirect,
} from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import {
  createAdminAuthClient,
  createAuthClient,
  getSessionUser,
  sendResetPasswordLink,
} from "../../auth.server";
import { type ResetPasswordLocales } from "./index.server";
import { languageModuleMap } from "~/locales/.server";

const createSchema = (locales: ResetPasswordLocales) => {
  return z.object({
    email: z
      .string()
      .email(locales.validation.email.email)
      .min(1, locales.validation.email.min),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/index"];

  return { locales };
};

const createMutation = (locales: ResetPasswordLocales) => {
  return makeDomainFunction(
    createSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    // get profile by email to be able to find user
    const profile = await prismaClient.profile.findFirst({
      where: {
        email: {
          contains: values.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (profile !== null) {
      const adminAuthClient = createAdminAuthClient();
      const { data, error } = await adminAuthClient.auth.admin.getUserById(
        profile.id
      );
      if (error !== null) {
        throw "Unexpected server error";
      } else if (data.user !== null) {
        // if user uses email provider send password reset link
        if (data.user.app_metadata.provider === "email") {
          const loginRedirect = values.loginRedirect
            ? `${environment.siteUrl}${values.loginRedirect}`
            : undefined;
          const { error } = await sendResetPasswordLink(
            // TODO: fix type issue
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            environment.authClient,
            values.email,
            loginRedirect
          );
          if (error !== null && error.message !== "User not found") {
            throw error.message;
          }
        }
        return values;
      }
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/index"];

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}`;

  const result = await performMutation({
    request,
    schema: createSchema(locales),
    mutation: createMutation(locales),
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return result;
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const schema = createSchema(locales);

  return (
    <>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="flex flex-col mv-w-full mv-items-center">
          <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
            <div className="mv-mb-6 mv-mt-12">
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                {locales.login}
              </Link>
            </div>
            <h1 className="mb-8">{locales.response.headline}</h1>
            {actionData !== undefined &&
            actionData.success &&
            actionData.data !== undefined ? (
              <>
                <p className="mb-4">
                  {locales.response.done.prefix}{" "}
                  <span className="mv-font-bold">{actionData.data.email}</span>{" "}
                  {locales.response.done.suffix}
                </p>
                <p className="mb-4">{locales.response.notice}</p>
              </>
            ) : (
              <RemixFormsForm
                method="post"
                schema={schema}
                hiddenFields={["loginRedirect"]}
                values={{
                  loginRedirect: loginRedirect || undefined,
                }}
              >
                {({ Field, Errors, register }) => (
                  <>
                    <p className="mb-4">{locales.form.intro}</p>

                    <Field name="loginRedirect" />
                    <div className="mb-8">
                      <Field name="email" label="E-Mail">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label={locales.form.label.email}
                              required
                              {...register("email")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        {locales.form.label.submit}
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixFormsForm>
            )}
          </div>
        </div>
        {/* <div className="flex flex-row -mx-4 mb-8 items-center">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4"></div>
        </div> */}
      </div>
    </>
  );
}
