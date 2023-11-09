import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "b",
  "i",
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

const REMOVE_HTML_TAGS_REGEX = /(<([^>]+)>)/gi;
const REMOVE_HTML_TAGS_REPLACEMENT = "";
export function removeHtmlTags(html: string) {
  return html.replace(REMOVE_HTML_TAGS_REGEX, REMOVE_HTML_TAGS_REPLACEMENT);
}
