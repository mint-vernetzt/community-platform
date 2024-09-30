import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "b",
  "i",
  "em",
  "strong",
  "a",
  "ul",
  "ol",
  "p",
  "li",
  "h2",
  "h3",
  "h4",
  "br",
];
const allowedAttributes = {
  a: ["href", "rel", "target"],
};
export function sanitizeUserHtml(
  html: string | null,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: { [key: string]: string[] };
  }
) {
  if (html === null) {
    return null;
  }
  return sanitizeHtml(
    html,
    options ?? {
      allowedTags,
      allowedAttributes,
    }
  );
}

const HTML_TAG_REGEX = /(<([^>]+)>)/gi;
const HTML_TAG_REPLACEMENT = "";
export function removeHtmlTags(html: string, replaceValue?: string) {
  return html.replace(HTML_TAG_REGEX, replaceValue || HTML_TAG_REPLACEMENT);
}

const HTML_ENTITY_REGEX = /(&([^;]+);)/gi;
const HTML_ENTITY_REPLACEMENT = "";
export function replaceHtmlEntities(html: string, replaceValue?: string) {
  return html.replace(
    HTML_ENTITY_REGEX,
    replaceValue || HTML_ENTITY_REPLACEMENT
  );
}
