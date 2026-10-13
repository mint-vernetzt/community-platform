import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

type Recipient = {
  firstName: string;
  email: string;
};

export async function sendFirstMail(profile: Recipient) {
  const textTemplatePath = "mail-templates/inactivity/first-text.hbs";
  const htmlTemplatePath = "mail-templates/inactivity/first-html.hbs";

  const subject =
    "Wir vermissen Dich in der Community | We miss you in the community";

  const content = {
    headline: {
      de: "Wir vermissen Dich in der Community",
      en: "We miss you in the community",
    },
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: { de: "Zur Community-Plattform", en: "To the community platform" },
    },
  };

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(
      mailerOptions,
      process.env.SYSTEM_MAIL_SENDER,
      profile.email,
      subject,
      text,
      html
    );
  } catch (error) {
    console.error(`Erste Mail an ${profile.email} fehlgeschlagen`, error);
    return false;
  }

  return true;
}

export async function sendSecondMail(profile: Recipient) {
  const textTemplatePath = "mail-templates/inactivity/second-text.hbs";
  const htmlTemplatePath = "mail-templates/inactivity/second-html.hbs";

  const subject =
    "Möchtest Du Dein Profil behalten? | Do you want to keep your profile?";

  const content = {
    headline: {
      de: "Möchtest Du Dein Profil behalten?",
      en: "Do you want to keep your profile?",
    },
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: { de: "Zur Community-Plattform", en: "To the community platform" },
    },
  };

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(
      mailerOptions,
      process.env.SYSTEM_MAIL_SENDER,
      profile.email,
      subject,
      text,
      html
    );
  } catch (error) {
    console.error(`Zweite Mail an ${profile.email} fehlgeschlagen`, error);
    return false;
  }

  return true;
}

export async function sendLastMail(profile: Recipient, deletionDate: Date) {
  const textTemplatePath = "mail-templates/inactivity/last-text.hbs";
  const htmlTemplatePath = "mail-templates/inactivity/last-html.hbs";

  const subject =
    "Letzte Errinnerung zu Deinem Profil | Last reminder about your profile";

  const content = {
    headline: {
      de: "Letzte Errinnerung zu Deinem Profil",
      en: "Last reminder about your profile",
    },
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: { de: "Zur Community-Plattform", en: "To the community platform" },
    },
    deletionDate: deletionDate.toLocaleDateString("de-DE"),
  };

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(
      mailerOptions,
      process.env.SYSTEM_MAIL_SENDER,
      profile.email,
      subject,
      text,
      html
    );
  } catch (error) {
    console.error(`Dritte Mail an ${profile.email} fehlgeschlagen`, error);
    return false;
  }

  return true;
}

export async function sendDeletedMail(profile: Recipient) {
  const textTemplatePath = "mail-templates/inactivity/deleted-text.hbs";
  const htmlTemplatePath = "mail-templates/inactivity/deleted-html.hbs";

  const subject = "Dein Account wurde gelöscht | Your account has been deleted";

  const content = {
    headline: {
      de: "Dein Account wurde gelöscht",
      en: "Your account has been deleted",
    },
    firstName: profile.firstName,
    button: {
      url: `${process.env.COMMUNITY_BASE_URL}/register`,
      text: { de: "Neu registrieren", en: "Register again" },
    },
  };

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(
      mailerOptions,
      process.env.SYSTEM_MAIL_SENDER,
      profile.email,
      subject,
      text,
      html
    );
  } catch (error) {
    console.error(`Löschbestätigung an ${profile.email} fehlgeschlagen`, error);
    return false;
  }

  return true;
}
