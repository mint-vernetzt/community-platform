import { prismaClient } from "~/prisma.server";
import {
  getSearchDocumentsSchema,
  SEARCH_DOCUMENTS_SEARCH_PARAM,
} from "./list.shared";
import { parseWithZod } from "@conform-to/zod";

export async function getDocumentsOfEvent(options: {
  slug: string;
  searchParams: URLSearchParams;
}) {
  const { slug, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchDocumentsSchema(),
  });

  let documents = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_DOCUMENTS_SEARCH_PARAM] === "undefined"
  ) {
    documents = await prismaClient.document.findMany({
      where: {
        events: { some: { event: { slug } } },
      },
      select: {
        id: true,
        filename: true,
        sizeInMB: true,
        title: true,
        credits: true,
        mimeType: true,
        path: true,
      },
    });
  } else {
    const query =
      submission.value[SEARCH_DOCUMENTS_SEARCH_PARAM].trim().split(" ");

    documents = await prismaClient.document.findMany({
      where: {
        events: {
          some: { event: { slug } },
        },
        OR: query.map((term) => {
          return {
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { filename: { contains: term, mode: "insensitive" } },
            ],
          };
        }),
      },
      select: {
        id: true,
        filename: true,
        sizeInMB: true,
        title: true,
        credits: true,
        mimeType: true,
        path: true,
      },
    });
  }

  return { submission: submission.reply(), documents };
}
