import type { Document } from "@prisma/client";
import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type EditEventDocumentLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/settings/documents/edit-document"];

export async function updateDocument(
  id: string,
  data: Pick<Document, "title" | "description">
) {
  await prismaClient.document.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
