import { type PrismaClient } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export const mockUsers = [
  {
    id: "1",
    email: "aktiv@test.de",
    last_sign_in_at: daysAgo(10).toISOString(),
  },
  {
    id: "2",
    email: "nie-eingeloggt@test.de",
    last_sign_in_at: undefined,
  },
  {
    id: "3",
    email: "erste-mail@test.de",
    last_sign_in_at: daysAgo(400).toISOString(),
  },
  {
    id: "4",
    email: "zweite-mail@test.de",
    last_sign_in_at: daysAgo(400).toISOString(),
  },
  {
    id: "5",
    email: "dritte-mail@test.de",
    last_sign_in_at: daysAgo(400).toISOString(),
  },
  {
    id: "6",
    email: "loeschen@test.de",
    last_sign_in_at: daysAgo(400).toISOString(),
  },
  {
    id: "7",
    email: "frisch@test.de",
    last_sign_in_at: daysAgo(400).toISOString(),
  },
];

export const mockProfiles = [
  {
    id: "1",
    username: "aktiv",
    email: "aktiv@test.de",
    firstName: "Anna",
    lastName: "Aktiv",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: null,
    inactivityReminderSentAt: null,
  },
  {
    id: "2",
    username: "nie-eingeloggt",
    email: "nie-eingeloggt@test.de",
    firstName: "Nils",
    lastName: "Neu",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: null,
    inactivityReminderSentAt: null,
  },
  {
    id: "3",
    username: "erste-mail",
    email: "erste-mail@test.de",
    firstName: "Emil",
    lastName: "Erst",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: null,
    inactivityReminderSentAt: null,
  },
  {
    id: "4",
    username: "zweite-mail",
    email: "zweite-mail@test.de",
    firstName: "Zoe",
    lastName: "Zwei",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: "firstSent",
    inactivityReminderSentAt: daysAgo(20),
  },
  {
    id: "5",
    username: "dritte-mail",
    email: "dritte-mail@test.de",
    firstName: "Dana",
    lastName: "Drei",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: "secondSent",
    inactivityReminderSentAt: daysAgo(20),
  },
  {
    id: "6",
    username: "loeschen",
    email: "loeschen@test.de",
    firstName: "Lena",
    lastName: "Letzt",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: "lastSent",
    inactivityReminderSentAt: daysAgo(20),
  },
  {
    id: "7",
    username: "frisch",
    email: "frisch@test.de",
    firstName: "Finn",
    lastName: "Frisch",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
    inactivityReminderState: null,
    inactivityReminderSentAt: null,
  },
  {
    id: "8",
    username: "ohne-user",
    email: "ohne-user@test.de",
    firstName: "Otto",
    lastName: "Ohne",
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
    inactivityReminderState: null,
    inactivityReminderSentAt: null,
  },
];

export function mockCreateAdminAuthClient() {
  const client = {
    auth: {
      admin: {
        getUserById: async (userId: string) => {
          const user = mockUsers.find((user) => user.id === userId);

          if (typeof user === "undefined") {
            return {
              data: { user: null },
              error: { message: "User not found" },
            };
          }

          return { data: { user: user }, error: null };
        },
      },
    },
  };

  return client as unknown as SupabaseClient;
}

export const mockPrismaClient = {
  profile: {
    findMany: async (args: {
      where: { createdAt: { lt: Date }; updatedAt: { lt: Date } };
    }) => {
      return mockProfiles.filter(
        (profile) =>
          profile.createdAt < args.where.createdAt.lt &&
          profile.updatedAt < args.where.updatedAt.lt
      );
    },
    findUnique: async (args: { where: { id: string } }) => {
      const profile = mockProfiles.find(
        (profile) => profile.id === args.where.id
      );

      if (typeof profile === "undefined") {
        return null;
      }

      return profile;
    },
  },
} as unknown as PrismaClient;
