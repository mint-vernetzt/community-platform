import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { z } from "zod";
import {
  createAdminAuthClient,
  createAuthClient,
  deleteUserByUid,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
  signOut,
} from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveProfileMode } from "../utils.server";
import { getProfileByUsername, validateLastAdmin } from "./delete.server";
import { createSchema } from "./delete.shared";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const username = getParamValueOrThrow(params, "username");

  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Unauthorized", {
    status: 403,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/delete"];

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    invariantResponse(false, locales.error.profileNotFound, { status: 404 });
  }

  return { locales };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/delete"];

  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  const formData = await request.formData();
  const schema = createSchema(locales);
  const submission = await parseWithZod(formData, {
    schema: () =>
      schema.transform(async (data, ctx) => {
        try {
          const { error } = await validateLastAdmin(sessionUser.id, locales);
          if (error !== null) {
            ctx.addIssue({
              path: ["confirmedToken"],
              code: "custom",
              message: error,
            });
            return z.NEVER;
          }
        } catch (error) {
          captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.error.serverError,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { error, headers } = await signOut(request);
  if (error !== null) {
    invariantResponse(false, locales.error.serverError, { status: 500 });
  }

  const adminAuthClient = createAdminAuthClient();

  const result = await deleteUserByUid(adminAuthClient, sessionUser.id);
  invariantResponse(result.error === null, locales.error.serverError, {
    status: 500,
  });

  return redirect("/goodbye", { headers });
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const schema = createSchema(locales);
  const [form, fields] = useForm({
    id: "change-url-form",
    constraint: getZodConstraint(schema),
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: schema,
      });
    },
    lastResult: navigation.state === "idle" ? actionData : null,
  });

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>

      <h4 className="mb-4 font-semibold">{locales.content.subline}</h4>

      <p className="mb-8">{locales.content.intro}</p>

      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <div className="mb-4">
          <Input
            {...getInputProps(fields.confirmedToken, { type: "text" })}
            key="confirmedToken"
            placeholder={locales.form.confirmed.placeholder}
          >
            <Input.Label htmlFor={fields.confirmedToken.id}>
              {locales.form.confirmed.label}
            </Input.Label>
            {typeof fields.confirmedToken.errors !== "undefined" &&
            fields.confirmedToken.errors.length > 0
              ? fields.confirmedToken.errors.map((error) => (
                  <Input.Error id={fields.confirmedToken.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))
              : null}
          </Input>
        </div>
        <Button type="submit" variant="outline">
          {locales.form.submit.label}
        </Button>
      </Form>
    </>
  );
}
