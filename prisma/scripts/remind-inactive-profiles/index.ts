import { createAdminAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { mockCreateAdminAuthClient, mockPrismaClient } from "./mock";
import {
  sendDeletedMail,
  sendFirstMail,
  sendLastMail,
  sendSecondMail,
} from "./mail";

const useMocks = false;

const prisma = useMocks ? mockPrismaClient : prismaClient;

async function main() {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 14);

  const profiles = await prisma.profile.findMany({
    where: {
      createdAt: { lt: oneYearAgo },
      updatedAt: { lt: oneYearAgo },
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      inactivityReminderState: true,
      inactivityReminderSentAt: true,
    },
  });

  console.log(`${profiles.length} Profile sind älter als ein Jahr.`);

  const adminAuthClient = useMocks
    ? mockCreateAdminAuthClient()
    : createAdminAuthClient();

  const inactiveProfiles = [];

  for (const profile of profiles) {
    const { data, error } = await adminAuthClient.auth.admin.getUserById(
      profile.id
    );

    if (error !== null || data.user === null) {
      console.log(
        `Kein Supabase User für Profil ${profile.username} (${profile.id})`
      );
      continue;
    }

    if (typeof data.user.last_sign_in_at === "undefined") {
      console.log(
        `Profil ${profile.username} (${profile.id}) hat sich noch nie eingeloggt`
      );
      continue;
    }

    const lastSignInAt = new Date(data.user.last_sign_in_at);

    if (lastSignInAt > oneYearAgo) {
      continue;
    }

    inactiveProfiles.push({
      ...profile,
      lastSignInAt: lastSignInAt,
    });
  }

  console.log(
    `${inactiveProfiles.length} Profile haben sich seit über einem Jahr nicht eingeloggt.`
  );

  for (const profile of inactiveProfiles) {
    if (profile.inactivityReminderState === null) {
      console.log(
        `Erste Mail an ${profile.email} (${profile.username}, ${profile.id})`
      );
      const sent = await sendFirstMail(profile);

      if (sent === false) {
        continue;
      }

      await prismaClient.profile.update({
        where: { id: profile.id },
        data: {
          inactivityReminderState: "firstSent",
          inactivityReminderSentAt: new Date(),
        },
      });
    } else if (
      profile.inactivityReminderState === "firstSent" &&
      profile.inactivityReminderSentAt !== null &&
      profile.inactivityReminderSentAt < fourteenDaysAgo
    ) {
      console.log(
        `Zweite Mail an ${profile.email} (${profile.username}, ${profile.id})`
      );
      const sent = await sendSecondMail(profile);

      if (sent === false) {
        continue;
      }

      await prismaClient.profile.update({
        where: { id: profile.id },
        data: {
          inactivityReminderState: "secondSent",
          inactivityReminderSentAt: new Date(),
        },
      });
    } else if (
      profile.inactivityReminderState === "secondSent" &&
      profile.inactivityReminderSentAt !== null &&
      profile.inactivityReminderSentAt < fourteenDaysAgo
    ) {
      console.log(
        `Dritte Mail an ${profile.email} (${profile.username}, ${profile.id})`
      );
      console.log(
        `  -> Löschdatum in der Mail: ${deletionDate.toLocaleDateString(
          "de-DE"
        )}`
      );
      const sent = await sendLastMail(profile, deletionDate);

      if (sent === false) {
        continue;
      }

      await prismaClient.profile.update({
        where: { id: profile.id },
        data: {
          inactivityReminderState: "lastSent",
          inactivityReminderSentAt: new Date(),
        },
      });
    } else if (
      profile.inactivityReminderState === "lastSent" &&
      profile.inactivityReminderSentAt !== null &&
      profile.inactivityReminderSentAt < fourteenDaysAgo
    ) {
      console.log(`Profil ${profile.username} (${profile.id}) wird gelöscht`);

      const profileBackup = await prisma.profile.findUnique({
        where: { id: profile.id },
        include: {
          avatarImageMetaData: true,
          backgroundImageMetaData: true,
          areas: true,
          memberOf: true,
          offers: true,
          participatedEvents: true,
          participantOnEventInvites: true,
          seekings: true,
          contributedEvents: true,
          teamMemberOfEvents: true,
          contactPersonsOfEvents: true,
          teamMemberOfProjects: true,
          waitingForEvents: true,
          profileVisibility: true,
          administeredEvents: true,
          administeredOrganizations: true,
          administeredProjects: true,
          notificationSettings: true,
          profileAbuseReport: true,
          organizationAbuseReport: true,
          eventAbuseReport: true,
          projectAbuseReport: true,
          abuseReports: true,
          joinOrganizationRequests: true,
          joinOrganizationInvites: true,
          joinEventInvites: true,
          claimOrganizationRequests: true,
        },
      });

      if (profileBackup === null) {
        throw new Error(
          `Profil ${profile.username} konnte nicht gefunden werden`
        );
      }

      const profileBackupJson = JSON.stringify(profileBackup, null, 2);

      console.log(`  -> Backup anlegen (${profileBackupJson.length} Zeichen)`);

      await prismaClient.$transaction([
        prismaClient.inactiveProfile.create({
          data: {
            id: profileBackup.id,
            jsonData: profileBackupJson,
          },
        }),
        prismaClient.profile.delete({
          where: { id: profile.id },
        }),
      ]);

      await sendDeletedMail(profile);
    } else {
      console.log(
        `Nichts zu tun für ${profile.username} (${profile.id}), State: ${profile.inactivityReminderState}`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("done");
  });
