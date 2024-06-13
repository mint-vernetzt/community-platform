import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import {
  createAdminAuthClient,
  createAuthClient,
  getSessionUser,
  sendResetPasswordLink,
} from "../../auth.server";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const abilities = await getFeatureAbilities(authClient, "next_navbar");

  return { abilities };
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
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
        console.error(error);
      } else if (data.user !== null) {
        // if user uses email provider send password reset link
        if (data.user.app_metadata.provider === "email") {
          const loginRedirect = values.loginRedirect
            ? `${environment.siteUrl}${values.loginRedirect}`
            : undefined;
          const { error } = await sendResetPasswordLink(
            // TODO: fix type issue
            // @ts-ignore
            environment.authClient,
            values.email,
            loginRedirect
          );
          console.log(error);
          if (error !== null && error.message !== "User not found") {
            throw error.message;
          }
        }

        return values;
      }
    }
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient, headers } = createAuthClient(request);

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}`;

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return json(result, { headers });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] relative z-10">
        {loaderData.abilities.next_navbar.hasAccess === false ? (
          <div className="flex flex-row -mx-4 justify-end">
            <div className="basis-full @md:mv-basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
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
        ) : null}
        <div className="flex flex-col @md:mv-flex-row -mx-4">
          <div className="basis-full @md:mv-basis-6/12"></div>
          <div className="basis-full @md:mv-basis-6/12 @xl:mv-basis-5/12 px-4">
            <h1 className="mb-8">{t("response.headline")}</h1>
            {actionData !== undefined &&
            actionData.success &&
            actionData.data !== undefined ? (
              <>
                <p className="mb-4">
                  {t("response.done.prefix")} {actionData.data.email}{" "}
                  {t("response.done.suffix")}
                </p>
                <p className="mb-4">{t("response.notice")}</p>
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
