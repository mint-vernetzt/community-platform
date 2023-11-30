import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { generateProjectSlug } from "~/utils.server";
import { createProjectOnProfile } from "./utils.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

export const handle = {
  i18n: ["routes/project/create"],
};

const createSchema = (t: TFunction) => {
  return z.object({
    projectName: z.string().min(1, t("validation.projectName.min")),
  });
};

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  return json({}, { headers: response.headers });
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(createSchema(t))(async (values) => {
    const slug = generateProjectSlug(values.projectName);
    return { ...values, slug };
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, ["routes/project/create"]);

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
  });

  if (result.success) {
    await createProjectOnProfile(
      sessionUser.id,
      result.data.projectName,
      result.data.slug
    );
    return redirect(`/project/${result.data.slug}`, {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

function Create() {
  const navigate = useNavigate();
  const { t } = useTranslation(["routes/project/create"]);
  const schema = createSchema(t);

  return (
    <>
      <section className="container md:mt-2">
        <div className="font-semi text-neutral-600 flex items-center">
          {/* TODO: get back route from loader */}
          <button onClick={() => navigate(-1)} className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="h-auto w-6"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span className="ml-2">{t("content.back")}</span>
          </button>
        </div>
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <h4 className="font-semibold">{t("content.headline")}</h4>
            <div className="pt-10 lg:pt-0">
              <RemixForm
                method="post"
                schema={schema}
                onTransition={({ reset, formState }) => {
                  if (formState.isSubmitSuccessful) {
                    reset();
                  }
                }}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <Field name="projectName" className="mb-4">
                      {({ Errors }) => (
                        <>
                          <Input
                            id="projectName"
                            label={t("form.projectName.label")}
                            {...register("projectName")}
                          />
                          <Errors />
                        </>
                      )}
                    </Field>
                    <button
                      type="submit"
                      className="btn btn-outline-primary ml-auto btn-small mb-8"
                    >
                      {t("form.submit.label")}
                    </button>
                    <Errors />
                  </>
                )}
              </RemixForm>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Create;
