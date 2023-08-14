import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "b",
  "i",
  "strong",
  "a",
  "ul",
  "p",
  "li",
  "h2",
  "h3",
  "h4",
];
const allowedAttributes = {
  a: ["href", "rel", "target"],
};
export function sanitizeUserHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  });
}
