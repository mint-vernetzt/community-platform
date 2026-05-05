import { z } from "zod";
import { type ImageCropperLocales } from "./components/legacy/ImageCropper/ImageCropper";
import { INTENT_FIELD_NAME } from "./form-helpers";
import { insertParametersIntoLocale } from "./lib/utils/i18n";
import { type ProjectAttachmentSettingsLocales } from "./routes/project/$slug/settings/attachments.server";

// TODO: Connect this with the equivalent nginx.conf settings
// Max upload size (Remember to change nginx.conf when changing this)
export const MAX_UPLOAD_FILE_SIZE = 6 * 1000 * 1000; // 6MB

// MIME types
export const DOCUMENT_MIME_TYPES = ["application/pdf"];
// Reference: https://www.iana.org/assignments/media-types/media-types.xhtml#image
export const IMAGE_MIME_TYPES = [
  // "image/aces",
  // "image/apng",
  // "image/avci",
  // "image/avcs",
  // "image/avif",
  // "image/bmp",
  // "image/cgm",
  // "image/dicom-rle",
  // "image/dpx",
  // "image/emf",
  // "image/example",
  // "image/fits",
  // "image/g3fax",
  // "image/gif",
  // "image/heic",
  // "image/heic-sequence",
  // "image/heif",
  // "image/heif-sequence",
  // "image/hej2k",
  // "image/ief",
  // "image/j2c",
  // "image/jaii",
  // "image/jais",
  // "image/jls",
  // "image/jp2",
  "image/jpeg",
  // "image/jph",
  // "image/jphc",
  // "image/jpm",
  // "image/jpx",
  // "image/jxl",
  // "image/jxr",
  // "image/jxrA",
  // "image/jxrS",
  // "image/jxs",
  // "image/jxsc",
  // "image/jxsi",
  // "image/jxss",
  // "image/ktx",
  // "image/ktx2",
  // "image/naplps",
  "image/png",
  // "image/prs.btif",
  // "image/prs.pti",
  // "image/pwg-raster",
  // "image/svg+xml",
  // "image/t38",
  // "image/tiff",
  // "image/tiff-fx",
  // "image/vnd.adobe.photoshop",
  // "image/vnd.airzip.accelerator.azv",
  // "image/vnd.cns.inf2",
  // "image/vnd.dece.graphic",
  // "image/vnd.djvu",
  // "image/vnd.dwg",
  // "image/vnd.dxf",
  // "image/vnd.dvb.subtitle",
  // "image/vnd.fastbidsheet",
  // "image/vnd.fpx",
  // "image/vnd.fst",
  // "image/vnd.fujixerox.edmics-mmr",
  // "image/vnd.fujixerox.edmics-rlc",
  // "image/vnd.globalgraphics.pgb",
  // "image/vnd.microsoft.icon",
  // "image/vnd.mix",
  // "image/vnd.ms-modi",
  // "image/vnd.mozilla.apng",
  // "image/vnd.net-fpx",
  // "image/vnd.pco.b16",
  // "image/vnd.radiance",
  // "image/vnd.sealed.png",
  // "image/vnd.sealedmedia.softseal.gif",
  // "image/vnd.sealedmedia.softseal.jpg",
  // "image/vnd.svf",
  // "image/vnd.tencent.tap",
  // "image/vnd.valve.source.texture",
  // "image/vnd.wap.wbmp",
  // "image/vnd.xiff",
  // "image/vnd.zbrush.pcx",
  // "image/webp",
  // "image/wmf",
];

// Form configuration
// Field name for inputs with type file to make file parser work -> Please use this as name attribute on all file upload forms
export const FILE_FIELD_NAME = "file";
// Field name for determining the bucket to upload the file to -> Please use this as name attribute on all file upload forms
export const BUCKET_FIELD_NAME = "bucket";
export const DOCUMENT_ID_FIELD_NAME = "documentId";
export const DOCUMENT_TITLE_FIELD_NAME = "title";
export const DOCUMENT_DESCRIPTION_FIELD_NAME = "description";
export const DOCUMENT_DESCRIPTION_MAX_LENGTH = 80;
export const SEARCH_DOCUMENTS_SEARCH_PARAM = "search_documents";
// Field value for determining the intent of the submitted form when using multiple forms on one route -> Please use this value as defaultValue attribute on file form submit button
export const UPLOAD_DOCUMENT_INTENT_VALUE = "upload";
export const EDIT_DOCUMENT_INTENT_VALUE = "edit";
export const REMOVE_DOCUMENT_INTENT_VALUE = "remove";
export const BUCKET_NAME_IMAGES = "images";
export const BUCKET_NAME_DOCUMENTS = "documents";

export function getUploadDocumentSchema(locales: {
  maxSize: string;
  invalidType: string;
}) {
  return z.object({
    [FILE_FIELD_NAME]: z
      .instanceof(File)
      .refine(
        (file) => {
          return file.size <= MAX_UPLOAD_FILE_SIZE;
        },
        insertParametersIntoLocale(locales.maxSize, {
          size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
        })
      )
      .refine((file) => {
        return DOCUMENT_MIME_TYPES.includes(file.type);
      }, locales.invalidType),
    [BUCKET_FIELD_NAME]: z.enum([BUCKET_NAME_DOCUMENTS]),
    [INTENT_FIELD_NAME]: z.enum([UPLOAD_DOCUMENT_INTENT_VALUE]),
  });
}

// TODO: When used with different buckets extend this with BUCKET_FIELD_NAME like above
export function nextGetUploadDocumentSchema(locales: {
  maxSize: string;
  invalidType: string;
  descriptionTooLong: string;
}) {
  return z.object({
    [FILE_FIELD_NAME]: z
      .instanceof(File)
      .refine(
        (file) => {
          return file.size <= MAX_UPLOAD_FILE_SIZE;
        },
        insertParametersIntoLocale(locales.maxSize, {
          size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
        })
      )
      .refine((file) => {
        return DOCUMENT_MIME_TYPES.includes(file.type);
      }, locales.invalidType),
    [DOCUMENT_TITLE_FIELD_NAME]: z.string().optional(),
    [DOCUMENT_DESCRIPTION_FIELD_NAME]: z
      .string()
      .max(
        DOCUMENT_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(locales.descriptionTooLong, {
          max: DOCUMENT_DESCRIPTION_MAX_LENGTH,
        })
      )
      .optional(),
  });
}

export function getUploadImageSchema(
  locales: ProjectAttachmentSettingsLocales | ImageCropperLocales
) {
  return {
    [FILE_FIELD_NAME]: z
      .instanceof(File)
      .refine(
        (file) => {
          return file.size <= MAX_UPLOAD_FILE_SIZE;
        },
        insertParametersIntoLocale(locales.upload.validation.image.size, {
          size: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
        })
      )
      .refine((file) => {
        return IMAGE_MIME_TYPES.includes(file.type);
      }, locales.upload.validation.image.type),
    [BUCKET_FIELD_NAME]: z.enum([BUCKET_NAME_IMAGES]),
    [INTENT_FIELD_NAME]: z.enum([UPLOAD_DOCUMENT_INTENT_VALUE]),
  };
}

export function getRemoveDocumentSchema() {
  return z.object({
    [DOCUMENT_ID_FIELD_NAME]: z.string().uuid(),
  });
}

export function getEditDocumentSchema(locales: { descriptionTooLong: string }) {
  return z.object({
    [DOCUMENT_ID_FIELD_NAME]: z.string().uuid(),
    [DOCUMENT_TITLE_FIELD_NAME]: z.string().optional(),
    [DOCUMENT_DESCRIPTION_FIELD_NAME]: z
      .string()
      .max(
        DOCUMENT_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(locales.descriptionTooLong, {
          max: DOCUMENT_DESCRIPTION_MAX_LENGTH,
        })
      )
      .optional(),
  });
}

export function getSearchDocumentsSchema() {
  return z.object({
    [SEARCH_DOCUMENTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}
