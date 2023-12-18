import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Button, Input, Link } from "@mint-vernetzt/components";
import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { deriveMode, generateProjectSlug } from "~/utils.server";
import { getSubmissionHash } from "./$slug/settings/utils.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { Trans, useTranslation } from "react-i18next";

const i18nNS = ["routes/project/create"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) =>
  z.object({
    projectName: z
      .string({
        required_error: t("validation.projectName.required"),
      })
      .max(80, t("validation.projectName.max")),
  });

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveMode(sessionUser);
  invariantResponse(
    mode !== "anon",
    "You have to be logged in to access this route",
    {
      status: 403,
    }
  );

  return json({}, { headers: response.headers });
};

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const t = await i18next.getFixedT(request, i18nNS);

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveMode(sessionUser);
  invariantResponse(mode !== "anon", t("error.invariantResponse"), {
    status: 403,
  });

  const schema = createSchema(t);

  // Validation
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      schema.transform(async (data, ctx) => {
        const slug = generateProjectSlug(data.projectName);
        if (intent !== "submit") {
          return { ...data, slug };
        }
        try {
          await prismaClient.profile.update({
            where: {
              id: sessionUser.id,
            },
            data: {
              teamMemberOfProjects: {
                create: {
                  project: {
                    create: {
                      name: data.projectName,
                      slug: slug,
                      published: false,
                      projectVisibility: {
                        create: {},
                      },
                    },
                  },
                },
              },
              administeredProjects: {
                create: {
                  project: {
                    connectOrCreate: {
                      create: {
                        name: data.projectName,
                        slug: slug,
                      },
                      where: {
                        slug: slug,
                      },
                    },
                  },
                },
              },
            },
          });
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message: t("error.unableToCreate"),
          });
          return z.NEVER;
        }

        return { ...data, slug };
      }),
    async: true,
  });

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const, {
      headers: response.headers,
    });
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      headers: response.headers,
      status: 400,
    });
  }

  return redirect(`/project/${submission.value.slug}/settings`, {
    headers: response.headers,
  });
};

function Create() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  const [form, fields] = useForm({
    id: "create-project-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData?.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: schema });
    },
  });

  return (
    <>
      <div className="container relative pt-20 pb-44">
        <div className="mv-flex mv-justify-center">
          <div className="mv-flex mv-flex-col mv-w-[480px] mv-gap-6 mv-p-8 mv-border mv-rounded-lg mv-border-gray-200">
            <div className="mv-flex mv-justify-between mv-items-center mv-gap-4">
              <h1 className="mv-text-primary mv-text-5xl mv-font-bold mv-mb-0">
                {t("content.headline")}
              </h1>
              {/* TODO: Add and style this when putting the create dialog inside a modal */}
              {/* <CircleButton variant="ghost" size="small">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.183617 0.183617C0.241674 0.125413 0.310643 0.0792341 0.386575 0.047726C0.462506 0.016218 0.543908 0 0.626117 0C0.708326 0 0.789728 0.016218 0.865659 0.047726C0.941591 0.0792341 1.01056 0.125413 1.06862 0.183617L4.37612 3.49237L7.68362 0.183617C7.74173 0.125507 7.81071 0.0794115 7.88664 0.0479627C7.96256 0.0165138 8.04394 0.000327229 8.12612 0.000327229C8.2083 0.000327229 8.28967 0.0165138 8.3656 0.0479627C8.44152 0.0794115 8.51051 0.125507 8.56862 0.183617C8.62673 0.241727 8.67282 0.310713 8.70427 0.386637C8.73572 0.462562 8.75191 0.543937 8.75191 0.626117C8.75191 0.708297 8.73572 0.789672 8.70427 0.865597C8.67282 0.941521 8.62673 1.01051 8.56862 1.06862L5.25987 4.37612L8.56862 7.68362C8.62673 7.74173 8.67282 7.81071 8.70427 7.88664C8.73572 7.96256 8.75191 8.04394 8.75191 8.12612C8.75191 8.2083 8.73572 8.28967 8.70427 8.3656C8.67282 8.44152 8.62673 8.51051 8.56862 8.56862C8.51051 8.62673 8.44152 8.67282 8.3656 8.70427C8.28967 8.73572 8.2083 8.75191 8.12612 8.75191C8.04394 8.75191 7.96256 8.73572 7.88664 8.70427C7.81071 8.67282 7.74173 8.62673 7.68362 8.56862L4.37612 5.25987L1.06862 8.56862C1.01051 8.62673 0.941521 8.67282 0.865597 8.70427C0.789672 8.73572 0.708297 8.75191 0.626117 8.75191C0.543937 8.75191 0.462562 8.73572 0.386637 8.70427C0.310713 8.67282 0.241727 8.62673 0.183617 8.56862C0.125507 8.51051 0.0794115 8.44152 0.0479627 8.3656C0.0165138 8.28967 0.000327229 8.2083 0.000327229 8.12612C0.000327229 8.04394 0.0165138 7.96256 0.0479627 7.88664C0.0794115 7.81071 0.125507 7.74173 0.183617 7.68362L3.49237 4.37612L0.183617 1.06862C0.125413 1.01056 0.0792341 0.941591 0.047726 0.865659C0.016218 0.789728 0 0.708326 0 0.626117C0 0.543908 0.016218 0.462506 0.047726 0.386575C0.0792341 0.310643 0.125413 0.241674 0.183617 0.183617Z"
                    fill="#currentColor"
                  />
                </svg>
              </CircleButton> */}
            </div>
            <p className="mv-text-sm">{t("content.intro1")}</p>
            <p className="mv-text-sm">
              <Trans
                i18nKey="content.intro2"
                ns={i18nNS}
                components={[
                  <Link
                    as="a"
                    to="https://mint-vernetzt.de/terms-of-use-community-platform/"
                    className="mv-text-primary"
                    isExternal
                  />,
                ]}
              />
            </p>
            <Form method="post" {...form.props}>
              <Input {...conform.input(fields.projectName)}>
                <Input.Label htmlFor={fields.projectName.id}>
                  {t("form.projectName.label")}
                </Input.Label>
                {typeof fields.projectName.error !== "undefined" && (
                  <Input.Error>{fields.projectName.error}</Input.Error>
                )}
              </Input>
            </Form>
            <p className="mv-text-xs">{t("content.explanation.headline")}</p>
            <p className="mv-text-xs">{t("content.explanation.intro")}</p>
            <div className="mv-flex mv-flex-col mv-gap-2">
              <Button type="submit" form={form.id}>
                {t("form.submit.label")}
              </Button>
              {/* TODO: Add and style this when putting the create dialog inside a modal */}
              <Button variant="outline" onClick={() => navigate(-1)}>
                {t("form.reset.label")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Create;
