export const FIRST_PUBLISH_EVENT_INTENT = "first-publish-event";
export const PUBLISH_EVENT_INTENT = "publish-event";
export const PUBLISH_EVENT_MODAL_SEARCH_PARAM = "publishEventModal";

export function getLinkIssueInfo(options: {
  section: string;
  issues: Array<{ section: string; fields: string[]; message: string }>;
  locales: {
    multiple: string;
  };
}) {
  const { section, issues, locales } = options;

  const sectionIssues = issues.filter((issue) => {
    return issue.section === section;
  });

  if (sectionIssues.length === 0) {
    return;
  }

  if (sectionIssues.length === 1) {
    return { hint: sectionIssues[0].message, issues: sectionIssues };
  }

  return { hint: locales.multiple, issues: sectionIssues };
}
