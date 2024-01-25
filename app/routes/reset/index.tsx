import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useActionData, useSearchParams } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { prismaClient } from "~/prisma.server";
import {
  createAdminAuthClient,
  createAuthClient,
  getSessionUser,
  sendResetPasswordLink,
} from "../../auth.server";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { Trans, useTranslation } from "react-i18next";

const i18nNS = ["routes/reset/index"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    email: z
      .string()
      .email(t("validation.email.email"))
      .min(1, t("validation.email.min")),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  return response;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    // Passing through a possible redirect after login (e.g. to an event)
    const emailRedirectTo = values.loginRedirect
      ? `${environment.siteUrl}?login_redirect=${values.loginRedirect}`
      : environment.siteUrl;

    // get profile by email to be able to find user
    const profile = await prismaClient.profile.findFirst({
      where: { email: values.email },
      select: { id: true },
    });

    if (profile !== null) {
      const adminAuthClient = createAdminAuthClient();
      const { data, error } = await adminAuthClient.auth.admin.getUserById(
        profile.id
      );
      if (error !== null) {
        console.error(error);
      } else if (data.user !== null) {
        // if user uses email provider send password reset link
        if (data.user.app_metadata.provider === "email") {
          const { error } = await sendResetPasswordLink(
            // TODO: fix type issue
            // @ts-ignore
            environment.authClient,
            values.email,
            emailRedirectTo
          );
          if (error !== null && error.message !== "User not found") {
            throw error.message;
          }
        }
      }

      return values;
    }
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const t = await i18next.getFixedT(request, i18nNS);

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}/verification`;

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return json(result, { headers: response.headers });
};

export default function Index() {
  const actionData = useActionData<typeof action>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                {t("login")}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12"></div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-8">{t("response.headline")}</h1>
            {actionData !== undefined &&
            actionData.success &&
            actionData.data !== undefined ? (
              <>
                <p className="mb-4">
                  <Trans
                    ns={i18nNS}
                    i18nKey="response.done"
                    values={{ email: actionData.data.email }}
                  ></Trans>
                </p>
                <p className="mb-4">{t("response.notice")}</p>
              </>
            ) : (
              <RemixForm
                method="post"
                schema={schema}
                hiddenFields={["loginRedirect"]}
                values={{
                  loginRedirect: loginRedirect || undefined,
                }}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <p className="mb-4">{t("form.intro")}</p>

                    <Field name="loginRedirect" />
                    <div className="mb-8">
                      <Field name="email" label="E-Mail">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label={t("form.label.email")}
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
                        {t("form.label.submit")}
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixForm>
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
