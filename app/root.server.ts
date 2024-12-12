import { prismaClient } from "~/prisma.server";
import { detectLanguage as nextDetectLanguage } from "./i18n.server";

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

export function detectLanguage(request: Request) {
  return nextDetectLanguage(request);
}
