import { faker } from "@faker-js/faker";
import type { Document } from "@prisma/client";
import { prismaClient } from "../../../app/prisma";

export type DocumentStructure =
  | "standard"
  | "smallest"
  | "emptyStrings"
  | "unicode"
  | "largest";

type BucketData = {
  document: {
    path: string;
    mimeType: string;
    filename: string;
    extension: string;
    sizeInMB: number;
  };
};

export function getDocumentData(
  structure: DocumentStructure,
  bucketData: BucketData
) {
  const documentData: Omit<Document, "id" | "updatedAt" | "createdAt"> = {
    title: generateTitle(structure),
    path: setPath(bucketData),
    mimeType: setMimeType(bucketData),
    filename: setFilename(bucketData),
    extension: setExtension(bucketData),
    sizeInMB: setSizeInMB(bucketData),
    description: generateDescription(structure),
  };
  return documentData;
}

export async function seedDocument(
  documentData: Omit<Document, "id" | "updatedAt" | "createdAt">
) {
  const result = await prismaClient.document.create({
    data: documentData,
    select: { id: true },
  });
  return result.id;
}

function generateTitle(structure: DocumentStructure) {
  let title = null;
  if (structure === "standard") {
    title = "Standard document title";
  }
  if (structure === "unicode") {
    title = "Unicode document title_Γ";
  }
  if (structure === "smallest") {
    title = null;
  }
  if (structure === "largest") {
    title = "A very large document title";
  }
  if (structure === "emptyStrings") {
    title = "";
  }
  return title;
}

function setPath(bucketData: BucketData) {
  const path = bucketData.document.path;
  return path;
}

function setMimeType(bucketData: BucketData) {
  const mimeType = bucketData.document.mimeType;
  return mimeType;
}

function setExtension(bucketData: BucketData) {
  const extension = bucketData.document.extension;
  return extension;
}

function setFilename(bucketData: BucketData) {
  const filename = bucketData.document.filename;
  return filename;
}

function setSizeInMB(bucketData: BucketData) {
  const sizeInMB = bucketData.document.sizeInMB;
  return sizeInMB;
}

function generateDescription(structure: DocumentStructure) {
  let description;
  if (structure === "smallest") {
    description = null;
  } else if (structure === "emptyStrings") {
    description = "";
  } else if (structure === "unicode") {
    description = "A description containing unicode character_Γ";
  } else if (structure === "largest") {
    description = faker.lorem.sentences(5).substring(0, 100);
  } else {
    description = faker.lorem.sentence();
  }
  return description;
}
