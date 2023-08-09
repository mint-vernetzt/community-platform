import sanitizeHtml from "sanitize-html";

const allowedTags = ["b", "i", "strong", "a", "ul", "p", "li"];
const allowedAttributes = {
  a: ["href", "rel", "target"],
};
export function sanitizeUserHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  });
}
