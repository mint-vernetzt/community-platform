export const locale = {
  title: "Accessibility statement for the MINTvernetzt community platform",
  date: "As of: June 18, 2025",
  scope: {
    title: "1. Scope of this declaration",
    content:
      "This accessibility statement applies to the MINTvernetzt community platform accessible at <0>{{baseUrl}}</0>, including the applications MINT Media Database and MINT Sharepic Generator accessible from there.",
  },
  legalBasis: {
    title: "2. Legal basis",
    content:
      "This statement is based on the requirements of the Federal Disability Equality Act (BFSG) in accordance with EU Directive 2016/2102 and corresponding national legal regulations.",
  },
  complianceStatus: {
    title: "3. Compliance status",
    disclaimer:
      "The MINTvernetzt community platform is committed to making its digital infrastructure accessible. Currently, the platform is not yet fully accessible. We are continuously working to improve accessibility.",
    restrictions: {
      title: "In particular, there are restrictions in the following areas:",
      userGeneratedContent: {
        title: "User-generated content",
        subline:
          "User-generated content may <0>in some cases</0> not be accessible, including:",
        list: {
          altTexts:
            "The insertion of ALT texts for images uploaded by users is currently not possible. We are working on making this possible.",
          material:
            "User-generated content, such as PDFs provided as material uploads, may not be accessible.",
          videos:
            "Not all videos embedded by users have subtitles or a translation in sign language.",
        },
      },
      ownContent: {
        title: "Own content",
        subline:
          "Own content is <0>in rare cases</0> not yet accessible, including:",
        list: {
          altTexts:
            "Missing text alternatives: Some images and non-text content have insufficient or no descriptive alternative texts.",
          simpleLanguage:
            "Explanations in simple language are not yet available and are still being created.",
          signLanguage:
            "Explanations in German sign language are not available.",
          structural:
            "Insufficient structuring outside of registration and login for events. Review and improvements of other content are ongoing.",
          contrast:
            "Weak contrast: Increased contrast and contrasts of graphics and controls are not always sufficient.",
          keyboardInteraction:
            "Keyboard interaction may be limited: Some functions may not be accessible or only partially accessible via keyboard, and focus indicators may be missing.",
          metaTitles:
            "Unclear or missing page titles in overview pages: The titles of web pages are not always appropriately chosen or are missing.",
          links:
            "Link purposes may not be clear: Links are often not clearly recognizable without additional context.",
          syntax:
            "Missing or incorrect syntax: HTML and ARIA markup may still contain errors, which causes problems for screen reader users.",
        },
      },
    },
  },
  measuresToImprove: {
    title: "4. Measures to improve accessibility",
    subline:
      "We are continuously implementing measures to improve the accessibility of the platform:",
    regularChecks:
      "<0>Regular checks:</0> Conducting accessibility tests in accordance with the guidelines of the Accessible Information Technology Ordinance (BITV 2.0).",
    training:
      "<0>Training:</0> Raising awareness and training the development team regarding accessible development in collaboration with the design team.",
    userFeedback:
      "<0>User feedback:</0> Integrating feedback from users to identify and address barriers.",
  },
  reportBarriers: {
    title: "5. Feedback and contact – Report barriers",
    subline:
      "If you notice any deficiencies in the accessible design of our platform or need information in an accessible format, please contact us:",
    email: "<0>Email:</0> <1>{{supportMail}}</1>",
    phone:
      "<0>Phone:</0> <1>+49 (0) 162 16 96 01 9</1> – <2>Inga Leffers</2>, Product Owner & Community Manager",
    disclaimer: "We strive to process your requests promptly.",
  },
  moreInformation: {
    title: "6. More information",
    content:
      "The MINTvernetzt Community Platform is a project by MINTvernetzt aimed at connecting the STEM community in Germany and promoting the exchange of knowledge and experiences. For more information, please visit our website: <0>https://www.mint-vernetzt.de</0>",
  },
  notice:
    "Note: This statement is regularly reviewed and updated to reflect the current state of accessibility of our platform.",
} as const;
