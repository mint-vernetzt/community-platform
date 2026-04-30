import { prismaClient } from "~/prisma.server";
import { parseWithZod } from "@conform-to/zod";
import {
  getSearchDocumentsSchema,
  SEARCH_DOCUMENTS_SEARCH_PARAM,
} from "~/storage.shared";

export async function getDocumentsOfEvent(options: {
  slug: string;
  searchParams: URLSearchParams;
}) {
  const { slug, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchDocumentsSchema(),
  });

  let documents = [];

  const documentsSelect = {
    id: true,
    filename: true,
    sizeInMB: true,
    title: true,
    description: true,
    credits: true,
    mimeType: true,
    path: true,
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_DOCUMENTS_SEARCH_PARAM] === "undefined"
  ) {
    documents = await prismaClient.document.findMany({
      where: {
        events: { some: { event: { slug } } },
      },
      select: documentsSelect,
    });
  } else {
    const query =
      submission.value[SEARCH_DOCUMENTS_SEARCH_PARAM].trim().split(" ");

    const documentsWithTitle = await prismaClient.document.findMany({
      where: {
        events: {
          some: { event: { slug } },
        },
        title: {
          not: null,
        },
        OR: query.map((term) => {
          return {
            OR: [{ title: { contains: term, mode: "insensitive" } }],
          };
        }),
      },
      select: documentsSelect,
    });

    const documentsWithoutTitle = await prismaClient.document.findMany({
      where: {
        events: {
          some: { event: { slug } },
        },
        title: {
          equals: null,
        },
        OR: query.map((term) => {
          return {
            OR: [{ filename: { contains: term, mode: "insensitive" } }],
          };
        }),
      },
      select: documentsSelect,
    });

    documents = [...documentsWithTitle, ...documentsWithoutTitle];
  }

  return { submission: submission.reply(), documents };
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export async function removeDocumentFromEvent(options: {
  eventId: string;
  documentId: string;
}) {
  const { eventId, documentId } = options;
  await prismaClient.documentOfEvent.deleteMany({
    where: {
      eventId,
      documentId,
    },
  });
}

export async function updateDocumentOfEvent(options: {
  documentId: string;
  data: {
    title?: string;
    description?: string;
  };
}) {
  const { documentId, data } = options;
  await prismaClient.document.update({
    where: { id: documentId },
    data,
  });
}
