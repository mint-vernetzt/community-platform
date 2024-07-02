import { prismaClient } from "~/prisma.server";
import i18n from "./i18n";
import { createCookie } from "@remix-run/node";

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
  let cookie = Object.fromEntries(
    request.headers
      .get("Cookie")
      ?.split(";")
      .map((cookie) => cookie.split("=")) ?? []
  ) as { i18next?: string };

  if (cookie.i18next) {
    return cookie.i18next;
  }

  return i18n.fallbackLng;
}
