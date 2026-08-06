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

  const content = {
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: "Zur Community-Plattform",
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
      "Wir vermissen Dich in der Community",
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

  const content = {
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: "Zur Community-Plattform",
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
      "Möchtest Du Dein Profil behalten?",
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

  const content = {
    firstName: profile.firstName,
    button: {
      url: process.env.COMMUNITY_BASE_URL,
      text: "Zur Community-Plattform",
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
      "Letzte Erinnerung zu Deinem Profil",
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

  const content = {
    firstName: profile.firstName,
    button: {
      url: `${process.env.COMMUNITY_BASE_URL}/register`,
      text: "Neu registrieren",
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
      "Dein Account wurde gelöscht",
      text,
      html
    );
  } catch (error) {
    console.error(`Löschbestätigung an ${profile.email} fehlgeschlagen`, error);
    return false;
  }

  return true;
}
