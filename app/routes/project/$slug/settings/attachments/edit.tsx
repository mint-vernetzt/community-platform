import { type DataFunctionArgs, json, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "../utils.server";
import { prismaClient } from "~/prisma.server";
import { parse } from "@conform-to/zod";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useMatches,
  useSearchParams,
} from "@remix-run/react";
import { Button, Input } from "@mint-vernetzt/components";
import { z } from "zod";
import { conform, useForm } from "@conform-to/react";

const documentSchema = z.object({
  title: z
    .string()

    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  description: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
});

const imageSchema = z.object({
  title: z
    .string()

    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  description: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  credits: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as null | "document" | "image";
  const fileId = url.searchParams.get("id");

  invariantResponse(
    type !== null &&
      (type === "document" || type === "image") &&
      fileId !== null,
    "Wrong or missing parameters",
    {
      status: 400,
    }
  );

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      id: true,
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

  let file;
  if (type === "document") {
    file = await prismaClient.documentOfProject.findFirst({
      where: {
        documentId: fileId,
        projectId: project.id,
      },
      select: {
        document: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });
  } else {
    file = await prismaClient.imageOfProject.findFirst({
      where: {
        imageId: fileId,
        projectId: project.id,
      },
      select: {
        image: {
          select: {
            title: true,
            description: true,
            credits: true,
          },
        },
      },
    });
  }

  invariantResponse(file !== null, "File not found", { status: 404 });

  return json(file, { headers: response.headers });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as null | "document" | "image";
  const id = url.searchParams.get("id");

  invariantResponse(
    type !== null && (type === "document" || type === "image") && id !== null,
    "Wrong or missing parameters",
    {
      status: 400,
    }
  );

  let schema;
  if (type === "document") {
    schema = documentSchema;
  } else {
    schema = imageSchema;
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });
  const hash = getSubmissionHash(submission);

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (type === "document") {
      await prismaClient.document.update({
        where: {
          id,
        },
        data: {
          ...submission.value,
        },
      });
    } else {
      await prismaClient.image.update({
        where: {
          id,
        },
        data: {
          ...submission.value,
        },
      });
    }
  } else {
    return json({ status: "error", submission, hash } as const, {
      headers: response.headers,
      status: 400,
    });
  }

  const redirectUrl = new URL("./", request.url);
  redirectUrl.searchParams.set("deep", "true");

  return redirect(redirectUrl.toString(), {
    headers: response.headers,
  });
};

function Edit() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const matches = useMatches();
  const type = searchParams.get("type") as "document" | "image";

  let defaultValue;
  if (type === "document") {
    defaultValue = {
      title: loaderData.document.title,
      description: loaderData.document.description,
    };
  } else {
    defaultValue = {
      title: loaderData.image.title,
      description: loaderData.image.description,
      credits: loaderData.image.credits,
    };
  }

  const [form, fields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      let schema;
      if (type === "document") {
        schema = documentSchema;
      } else {
        schema = imageSchema;
      }

      const result = parse(values.formData, { schema });
      return result;
    },
    defaultValue,
    lastSubmission:
      typeof actionData !== "undefined" ? actionData.submission : undefined,
  });

  return (
    <div className="mv-absolute mv-top-0 mv-left-0 mv-z-20 mv-w-full p-4 mv-min-h-full mv-bg-black mv-flex mv-justify-center mv-items-center mv-bg-opacity-50">
      <div className="mv-w-[480px] mv-max-w-full mv-bg-white mv-p-8 mv-flex mv-flex-col mv-gap-6 mv-shadow-lg mv-rounded-lg">
        <div className="mv-flex mv-justify-between">
          <h2 className="mv-text-primary mv-text-5xl mv-font-semibold mv-mb-0">
            {type === "document"
              ? "Dokument edititeren"
              : "Fotoinformation edititeren"}
          </h2>
          <Link
            to={`${matches[matches.length - 2].pathname}?deep`} // last layout route
            prefetch="intent"
            className="mv-pl-4"
          >
            <svg
              width="32"
              height="33"
              viewBox="0 0 32 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.78618 10.2876L9.78618 10.2876L9.78743 10.2864C9.8153 10.2584 9.84841 10.2363 9.88485 10.2211C9.9213 10.206 9.96037 10.1982 9.99983 10.1982C10.0393 10.1982 10.0784 10.206 10.1148 10.2211C10.1513 10.2363 10.1844 10.2584 10.2122 10.2864L10.2128 10.2869L15.5048 15.5809L15.9998 16.0762L16.4949 15.5809L21.7868 10.287C21.7868 10.287 21.7869 10.2869 21.7869 10.2869C21.8149 10.259 21.848 10.2368 21.8845 10.2217C21.9211 10.2065 21.9603 10.1988 21.9998 10.1988C22.0394 10.1988 22.0786 10.2065 22.1151 10.2217C22.1517 10.2368 22.1849 10.259 22.2129 10.287C22.2408 10.315 22.263 10.3482 22.2782 10.3847L22.9249 10.1168L22.2782 10.3847C22.2933 10.4213 22.3011 10.4604 22.3011 10.5C22.3011 10.5396 22.2933 10.5788 22.2782 10.6153L22.9249 10.8832L22.2782 10.6153C22.263 10.6518 22.2409 10.685 22.213 10.7129C22.2129 10.713 22.2129 10.713 22.2129 10.713L16.919 16.0049L16.4237 16.5L16.919 16.9951L22.2129 22.287C22.2129 22.287 22.2129 22.2871 22.213 22.2871C22.2409 22.315 22.263 22.3482 22.2782 22.3847L22.9249 22.1168L22.2782 22.3847C22.2933 22.4213 22.3011 22.4604 22.3011 22.5C22.3011 22.5396 22.2933 22.5788 22.2782 22.6153L22.9249 22.8832L22.2782 22.6153C22.263 22.6519 22.2408 22.6851 22.2129 22.713C22.1849 22.741 22.1517 22.7632 22.1151 22.7783L22.383 23.4251L22.1151 22.7783C22.0786 22.7935 22.0394 22.8013 21.9998 22.8013C21.9603 22.8013 21.9211 22.7935 21.8845 22.7783L21.6167 23.4251L21.8845 22.7783C21.848 22.7632 21.8149 22.7411 21.7869 22.7131C21.7869 22.7131 21.7868 22.7131 21.7868 22.713L16.4949 17.4191L15.9998 16.9239L15.5048 17.4191L10.2129 22.713C10.2128 22.7131 10.2128 22.7131 10.2128 22.7131C10.1848 22.7411 10.1516 22.7632 10.1151 22.7783L10.383 23.4251L10.1151 22.7783C10.0786 22.7935 10.0394 22.8013 9.99983 22.8013C9.96027 22.8013 9.92109 22.7935 9.88455 22.7783L9.61667 23.4251L9.88454 22.7783C9.848 22.7632 9.81479 22.741 9.78681 22.713C9.75883 22.6851 9.73664 22.6519 9.7215 22.6153C9.70636 22.5788 9.69857 22.5396 9.69857 22.5C9.69857 22.4605 9.70636 22.4213 9.7215 22.3847C9.73662 22.3482 9.75878 22.315 9.78672 22.2871C9.78675 22.2871 9.78678 22.287 9.78681 22.287L15.0807 16.9951L15.576 16.5L15.0807 16.0049L9.78672 10.7129L9.78618 10.7124C9.75824 10.6845 9.73608 10.6514 9.72095 10.615C9.70583 10.5786 9.69805 10.5395 9.69805 10.5C9.69805 10.4606 9.70583 10.4215 9.72095 10.385C9.73608 10.3486 9.75824 10.3155 9.78618 10.2876Z"
                fill="#154194"
                stroke="#154194"
                strokeWidth="1.4"
              />
            </svg>
          </Link>
        </div>
        <Form method="post" {...form.props}>
          <div className="mv-flex mv-flex-col mv-gap-6">
            <Input {...conform.input(fields.title)}>
              <Input.Label>Titel</Input.Label>
              {typeof fields.title.error !== "undefined" && (
                <Input.Error>{fields.title.error}</Input.Error>
              )}
            </Input>
            {type === "image" && (
              <Input {...conform.input(fields.credits)} maxLength={80}>
                <Input.Label>Credits</Input.Label>
                <Input.HelperText>
                  Bitte nenne hier den oder die Urheber:in des Bildes
                </Input.HelperText>
                {typeof fields.credits.error !== "undefined" && (
                  <Input.Error>{fields.credits.error}</Input.Error>
                )}
              </Input>
            )}
            <Input {...conform.input(fields.description)} maxLength={80}>
              <Input.Label>Beschreibung</Input.Label>
              {type === "image" && (
                <Input.HelperText>
                  Hilf blinden Menschen mit Deiner Bildbeschreibung zu
                  verstehen, was auf dem Bild zu sehen ist.
                </Input.HelperText>
              )}
              {typeof fields.description.error !== "undefined" && (
                <Input.Error>{fields.description.error}</Input.Error>
              )}
            </Input>
            <div className="mv-flex mv-flex-col mv-gap-4">
              <Button type="submit">Speichern</Button>
              <Button
                as="a"
                href={`${matches[matches.length - 2].pathname}?deep`}
                variant="outline"
              >
                Verwerfen
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Edit;
