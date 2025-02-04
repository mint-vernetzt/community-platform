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
