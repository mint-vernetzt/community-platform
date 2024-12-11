import { prismaClient } from "~/prisma.server";
import i18nServer from "./i18next.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      termsAccepted: true,
    },
    where: {
      id,
    },
  });
}

export async function detectLanguage(request: Request) {
  return await i18nServer.getLocale(request);
}
