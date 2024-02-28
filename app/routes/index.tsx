import { Button, Roadmap } from "@mint-vernetzt/components";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import type { KeyboardEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { FormProps } from "remix-forms";
import { performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUser, signIn } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { H1, H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { getFeatureAbilities } from "~/lib/utils/application";
import { CountUp } from "./__components";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "./utils.server";

const i18nNS = ["routes/index"];
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  loginRedirect: z.string().optional(),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixFormsForm<Schema> {...props} />;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    // Default redirect on logged in user
    return redirect("/dashboard");
  }

  const abilities = await getFeatureAbilities(authClient, ["keycloak"]);
  try {
    const profileCount = await getProfileCount();
    const organizationCount = await getOrganizationCount();
    const eventCount = await getEventCount();
    const projectCount = await getProjectCount();

    return json({
      profileCount,
      organizationCount,
      eventCount,
      projectCount,
      abilities,
    });
  } catch (error) {
    console.log(error);
  }
};

const mutation = makeDomainFunction(schema)(async (values) => {
  return { ...values };
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const submission = await performMutation({
    request,
    schema,
    mutation,
  });

  if (submission.success) {
    const { error, headers } = await signIn(
      request,
      submission.data.email,
      submission.data.password
    );

    if (error !== null) {
      if (error.message === "Invalid login credentials") {
        return json({
          message:
            "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
        });
      } else {
        throw json({ message: "Server Error" }, { status: 500 });
      }
    }
    if (submission.data.loginRedirect) {
      return redirect(submission.data.loginRedirect, {
        headers: headers,
      });
    } else {
      return redirect("/dashboard", {
        headers: headers,
      });
    }
  }

  return json(submission);
};

export default function Index() {
  const submit = useSubmit();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const loginError =
    actionData !== undefined && "message" in actionData
      ? actionData.message
      : null;
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(event.currentTarget);
    }
  };
  const { t } = useTranslation(i18nNS);

  ///* Verlauf (weiß) */
  //background: linear-gradient(358.45deg, #FFFFFF 12.78%, rgba(255, 255, 255, 0.4) 74.48%, rgba(255, 255, 255, 0.4) 98.12%);
  return (
    <>
      <section className="-mt-8 bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)]">
        <div className="py-16 lg:py-20 relative overflow-hidden xl:min-h-[calc(100vh-129px)] md:flex md:items-center">
          <div className="absolute top-[50%] left-0 -ml-[250px] mt-[200px] hidden lg:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="579"
              height="544"
              fill="none"
            >
              <path
                fill="#FFCF53"
                d="M291.146 532.638S105.447 474.955 40.529 432.061C-24.39 389.168-1.023 154 40.528 54.714 72.893-22.624 225.11-4.286 393.83 32.2c197.157 42.635 202.564 117.989 167.847 345.815C533.904 560.277 393.83 555 291.146 532.638Z"
              />
            </svg>
          </div>

          <div className="absolute top-[-80px] left-1/2 ml-[400px] hidden lg:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="945"
              height="947"
              fill="none"
            >
              <path
                fill="#FFCF53"
                d="M508.34 945.443c-89.582 9.463-180.276-67.216-195.857-76.352-15.581-9.136-180.122-118.666-263.692-206.297-104.462-109.538-28.635-229.26 123.96-490.517 152.596-261.258 257.514-203.28 580.525 27.841 338.964 242.537 139.878 409.42 56.878 514.42-83 105-212.232 221.442-301.814 230.905Z"
              />
            </svg>
          </div>

          <div className="container relative">
            <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
              <div className="md:col-start-1 md:col-span-7 xl:col-start-2 xl:col-span-5 md:flex md:items-center">
                <div>
                  <H1
                    name={t("welcome")}
                    className="text-center sm:text-left leading-none"
                  >
                    {t("welcome")}
                  </H1>
                  <p className="mt-8 mb-8 lg:mb-0 text-primary">{t("intro")}</p>
                </div>
              </div>

              <div className="md:col-start-8 md:col-span-5 lg:col-start-9 lg:col-span-4 xl:col-start-8 xl:col-span-4">
                <div className="py-8 mv-bg-white sm:mv-bg-neutral-50 sm:rounded-3xl sm:p-8 sm:shadow-[4px_5px_26px_-8px_rgba(177,111,171,0.95)]">
                  {loaderData.abilities.keycloak.hasAccess && (
                    <div className="text-center">
                      <Button
                        as="a"
                        size="large"
                        href={`/auth/keycloak${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        variant="outline"
                        fullSize
                      >
                        {t("login.intro")}
                      </Button>
                      <a
                        href="https://mint-id.org/faq"
                        target="_blank"
                        rel="noreferrer "
                        className="block py-2 text-primary font-semibold underline"
                      >
                        {t("login.moreInformation")}
                      </a>
                      <div className="mt-4 mb-8">
                        <hr className="mx-5" />
                        <span className="block -my-3 mx-auto w-fit px-4 text-primary mv-bg-white sm:mv-bg-neutral-50 font-bold">
                          {t("login.or")}
                        </span>
                      </div>
                    </div>
                  )}
                  <LoginForm
                    method="post"
                    schema={schema}
                    hiddenFields={["loginRedirect"]}
                    values={{
                      loginRedirect: loginRedirect || undefined,
                    }}
                    onKeyDown={handleKeyPress}
                  >
                    {({ Field, Errors, register }) => (
                      <>
                        <Errors className="mv-p-3 mv-mb-3 mv-bg-error mv-text-white">
                          {loginError}
                        </Errors>

                        <Field name="email" label="E-Mail">
                          {({ Errors }) => (
                            <div className="mb-4">
                              <Input
                                id="email"
                                label={t("form.label.email")}
                                {...register("email")}
                              />
                              <Errors />
                            </div>
                          )}
                        </Field>
                        <Field name="password" label="Passwort">
                          {({ Errors }) => (
                            <div className="mb-4">
                              <InputPassword
                                id="password"
                                label={t("form.label.password")}
                                {...register("password")}
                              />
                              <Errors />
                            </div>
                          )}
                        </Field>

                        <Field name="loginRedirect" />
                        <div className="mt-4 mb-2">
                          <Button
                            size="large"
                            fullSize
                            name={t("form.label.submit")}
                          >
                            {t("form.label.submit")}
                          </Button>
                        </div>
                      </>
                    )}
                  </LoginForm>
                  {loaderData.abilities.keycloak.hasAccess ? (
                    <>
                      <div className="mb-6 text-center">
                        <Link
                          to={`/reset${
                            loginRedirect
                              ? `?login_redirect=${loginRedirect}`
                              : ""
                          }`}
                          className="text-primary font-bold underline"
                        >
                          {t("login.passwordForgotten")}
                        </Link>
                      </div>
                      <div className="text-center">{t("login.noMember")}</div>
                      <div className="flex justify-center gap-6">
                        <Link
                          to={`/register${
                            loginRedirect
                              ? `?login_redirect=${loginRedirect}`
                              : ""
                          }`}
                          className="text-primary font-semibold underline"
                        >
                          {t("login.registerByEmail")}
                        </Link>
                        <Link
                          to={`/auth/keycloak${
                            loginRedirect
                              ? `?login_redirect=${loginRedirect}`
                              : ""
                          }`}
                          className="text-primary font-semibold underline"
                        >
                          {t("login.createMintId")}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-6 text-center">
                        <Link
                          to={`/reset${
                            loginRedirect
                              ? `?login_redirect=${loginRedirect}`
                              : ""
                          }`}
                          className="text-primary font-bold underline"
                        >
                          {t("login.passwordForgotten")}
                        </Link>
                      </div>

                      <div className="text-center">
                        {t("login.noMember")}{" "}
                        <Link
                          to={`/register${
                            loginRedirect
                              ? `?login_redirect=${loginRedirect}`
                              : ""
                          }`}
                          className="text-primary font-bold underline"
                        >
                          {t("login.register")}
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center p-4 pb-0 text-primary text-sm">
                  <p>
                    <Trans i18nKey="opportunities" ns={i18nNS} />
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 bottom-8 hidden xl:block">
            <a href="#intro">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="55"
                height="37"
                className="drop-shadow-[0px_5px_4px_0px_#FFEFFF]"
              >
                <g>
                  <path
                    fill="#154194"
                    fillRule="evenodd"
                    d="M4.531.587c.168-.186.367-.334.587-.434a1.658 1.658 0 0 1 1.385 0c.22.1.42.248.587.434L27.5 23.17 47.91.587a1.81 1.81 0 0 1 .588-.434 1.66 1.66 0 0 1 1.385 0c.22.101.419.249.587.434.168.186.301.407.392.65a2.187 2.187 0 0 1 0 1.532c-.09.243-.224.464-.392.65L28.78 27.413a1.808 1.808 0 0 1-.587.434 1.658 1.658 0 0 1-1.385 0c-.22-.1-.42-.248-.587-.434L4.53 3.419a2.025 2.025 0 0 1-.393-.65 2.185 2.185 0 0 1 0-1.532c.091-.243.225-.464.393-.65Z"
                    clipRule="evenodd"
                  />
                </g>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 relative" id="intro">
        <div className="container relative">
          <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
            <div className="md:col-start-2 md:col-span-10 xl:col-start-3 xl:col-span-8">
              <H3 className="text-center font-semibold all-small-caps mb-12">
                {t("content.education.headline")}
              </H3>
              <p className="text-3xl font-semibold text-primary mb-12 hyphens-auto">
                <Trans
                  i18nKey="content.education.content"
                  ns={i18nNS}
                  components={[
                    <span className="bg-lilac-200" />,
                    <span className="hyphens-manual" />,
                  ]}
                />
              </p>
              <p className="text-center">
                <Link
                  to={`/register${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  className="btn btn-primary"
                >
                  {t("content.education.action")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 relative bg-primary text-white">
        <div className="container relative">
          <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
            <div className="md:col-start-2 md:col-span-10 xl:col-start-3 xl:col-span-8">
              <H3 className="text-center font-semibold all-small-caps mb-12 text-white tracking-wider">
                {t("content.growth.headline")}
              </H3>
              <div className="md:grid md:grid-cols-4 md:gap-6 lg:gap-8">
                <div className="text-center mb-8">
                  <p className="text-7xl leading-tight font-bold">
                    <CountUp
                      end={loaderData.profileCount}
                      enableScrollSpy={true}
                      scrollSpyDelay={100}
                      scrollSpyOnce={true}
                      separator="."
                    />
                  </p>
                  <p className="font-bold">{t("content.growth.profiles")}</p>
                </div>
                <div className="text-center mb-8">
                  <p className="text-7xl leading-tight font-bold">
                    <CountUp
                      end={loaderData.organizationCount}
                      enableScrollSpy={true}
                      scrollSpyDelay={100}
                      scrollSpyOnce={true}
                      separator="."
                    />
                  </p>
                  <p className="font-bold">
                    {t("content.growth.organizations")}
                  </p>
                </div>
                <div className="text-center mb-8">
                  <p className="text-7xl leading-tight font-bold">
                    <CountUp
                      end={loaderData.eventCount}
                      enableScrollSpy={true}
                      scrollSpyDelay={100}
                      scrollSpyOnce={true}
                      separator="."
                    />
                  </p>
                  <p className="font-bold">{t("content.growth.events")}</p>
                </div>
                <div className="text-center mb-8">
                  <p className="text-7xl leading-tight font-bold">
                    <CountUp
                      end={loaderData.projectCount}
                      enableScrollSpy={true}
                      scrollSpyDelay={100}
                      scrollSpyOnce={true}
                      separator="."
                    />
                  </p>
                  <p className="font-bold">{t("content.growth.projects")}</p>
                </div>
              </div>
              <p className="text-center font-bold">
                {t("content.growth.join")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Roadmap />

      <section className="py-16 lg:py-24 relative overflow-hidden lg:min-h-[700px] bg-beige-100 -mb-8">
        <div className="absolute top-0 left-1/2 lg:ml-[calc(992px/12*5)] 2xl:ml-[calc(1488px/12*5)] hidden lg:block">
          <svg xmlns="http://www.w3.org/2000/svg" width="730" height="724">
            <g fill="none" fillRule="evenodd">
              <path
                fill="#BE88BA"
                fillRule="nonzero"
                d="M281.794 16.486c62.702-16.409 135.5 28.338 147.57 33.153 12.071 4.815 140.949 64.953 209.862 118.26 86.142 66.634 45.138 159.988-35.185 362.317-80.323 202.329-161.219 172.422-415.959 42.912C-79.241 437.222 44.349 297.002 92.047 213.345c47.698-83.658 127.046-180.449 189.747-196.859Z"
              />
              <path
                stroke="#1B54C0"
                strokeWidth="3"
                d="M727.79 409.534c-8.146 67.976-80.306 122.201-89.711 132.2-9.406 9.998-118.402 113.381-197.47 160.474-98.836 58.866-174.713-17.574-342.47-174.842C-69.618 370.097-8.907 302.169 216.992 101.943 454.05-108.172 544.015 67.576 607.77 146.839c63.755 79.264 128.165 194.719 120.02 262.695Z"
              />
            </g>
          </svg>
        </div>
        <div className="container relative">
          <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
            <div className="md:col-start-2 md:col-span-10 xl:col-start-3 xl:col-span-8">
              <H3 className="text-center font-semibold all-small-caps mb-12 tracking-wider">
                {t("content.more.headline")}
              </H3>
              <p className="text-3xl font-semibold text-primary mb-12 hyphens-auto">
                <Trans
                  i18nKey="content.more.content"
                  ns={i18nNS}
                  components={[<span className="bg-lilac-200" />]}
                />
              </p>
              <p className="text-center">
                <a
                  href="https://mint-vernetzt.de/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-primary inline-flex items-center gap-2 hover:border-primary"
                >
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      className="w-4 h-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth=".3"
                        d="M7.477 3.625a.375.375 0 0 0-.375-.375H2.125C1.504 3.25 1 3.754 1 4.375v7.5C1 12.496 1.504 13 2.125 13h7.5c.621 0 1.125-.504 1.125-1.125V6.898a.375.375 0 0 0-.75 0v4.977a.375.375 0 0 1-.375.375h-7.5a.375.375 0 0 1-.375-.375v-7.5c0-.207.168-.375.375-.375h4.977a.375.375 0 0 0 .375-.375Z"
                        clipRule="evenodd"
                      />
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth=".3"
                        d="M13 1.375A.375.375 0 0 0 12.625 1h-3.75a.375.375 0 1 0 0 .75h2.845L5.61 7.86a.375.375 0 0 0 .53.53l6.11-6.11v2.845a.375.375 0 0 0 .75 0v-3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span>{t("content.more.action")}</span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
