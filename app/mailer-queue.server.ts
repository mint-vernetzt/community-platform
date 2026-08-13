import { captureException } from "@sentry/node";
import { promise as queue, type queueAsPromised } from "fastq";
import { Event, TaskTimer } from "tasktimer";
import { z } from "zod";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "./mailer.server";
import { prismaClient } from "./prisma.server";
import { insertParametersIntoLocale } from "./lib/utils/i18n";
import { languageModuleMap } from "./locales/.server";
import { getVenueString } from "./utils.shared";

declare global {
  var __taskTimer: TaskTimer | undefined;
  var __mailQueue: queueAsPromised<string> | undefined;
}

let taskTimer: TaskTimer;
let mailQueue: queueAsPromised<string>;

if (process.env.NODE_ENV === "production") {
  taskTimer = new TaskTimer(1000 * 60); // 1 minute interval in production
  mailQueue = queue(processTransaction, 1); // 1 concurrent job
} else {
  if (typeof global.__taskTimer === "undefined") {
    global.__taskTimer = new TaskTimer({ interval: 1000 * 1 }); // 1 second interval in development and test
  }
  taskTimer = global.__taskTimer;
  taskTimer.removeAllListeners();
  if (typeof global.__mailQueue === "undefined") {
    global.__mailQueue = queue(processTransaction, 1); // 1 concurrent job
  }
  mailQueue = global.__mailQueue;
}

async function onTick() {
  const now = new Date();
  // Fetch all events where participants or guests should be reminded
  try {
    // Fetch all events that are starting tomorrow
    const events = await prismaClient.event.findMany({
      where: {
        startTime: {
          gte: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0,
            0,
            0
          ),
          lt: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 2,
            0,
            0,
            0
          ),
        },
        published: true,
        external: false,
        reminderState: "open",
      },
      select: {
        id: true,
        slug: true,
        name: true,
        startTime: true,
        venueName: true,
        venueStreet: true,
        venueStreetNumber: true,
        venueZipCode: true,
        venueCity: true,
        conferenceLink: true,
        participants: {
          select: {
            profile: {
              select: {
                firstName: true,
                email: true,
              },
            },
          },
        },
        guests: {
          select: {
            email: true,
            firstName: true,
            revocationToken: true,
          },
          where: {
            confirmed: true,
            onWaitingList: false,
          },
        },
      },
    });

    for (const event of events) {
      const receiver = [
        ...event.participants.map((relation) => {
          return {
            ...relation.profile,
            revocationToken: null as string | null,
            isGuest: false,
          };
        }),
        ...event.guests.map((guest) => {
          return {
            ...guest,
            isGuest: true,
          };
        }),
      ];

      const locales = languageModuleMap["de"]["root"];

      const subject = insertParametersIntoLocale(
        locales.route.event.reminder.oneDayBefore.subject,
        {
          eventName: event.name,
        }
      );
      const textTemplatePath =
        "mail-templates/event/reminder-one-day-before-text.hbs";
      const htmlTemplatePath =
        "mail-templates/event/reminder-one-day-before-html.hbs";

      for (const profile of receiver) {
        const content = {
          headline: subject,
          profile,
          event: {
            name: event.name,
            url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail`,
            startDate: event.startTime.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            startTime: event.startTime.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timezone: "MEZ",
            location: getVenueString(event),
            conferenceLink: event.conferenceLink,
            revocationLink: null as string | null,
          },
        };

        if (profile.isGuest && profile.revocationToken !== null) {
          const revocationLink = `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${profile.revocationToken}&confirmation_redirect=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail`)}`)}`;
          content.event.revocationLink = revocationLink;
        }

        const text = await getCompiledMailTemplate(
          textTemplatePath,
          content,
          "text"
        );
        const html = await getCompiledMailTemplate(
          htmlTemplatePath,
          content,
          "html"
        );
        await scheduleMail({
          eventId: event.id,
          recipient: profile.email,
          subject,
          plainText: text,
          html,
        });
      }
      await prismaClient.event.update({
        where: { id: event.id },
        data: { reminderState: "firstScheduled" },
      });
    }
  } catch (error) {
    captureException(error);
  }

  // Fetch all event transactions that are scheduled for now or earlier and are not already sent or aborted
  try {
    const eventTransactions = await prismaClient.eventTransaction.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        state: { notIn: ["sent", "aborted", "processing"] },
      },
      orderBy: {
        scheduledFor: "asc", // Process the oldest scheduled transaction first
      },
      take: 10, // Limit to 10 transactions per tick to limit mail sending rate
    });
    for (const eventTransaction of eventTransactions) {
      mailQueue.push(eventTransaction.id).catch(async (error) => {
        captureException(error);
        try {
          if (eventTransaction.retries.length >= 3) {
            await prismaClient.eventTransaction.update({
              where: { id: eventTransaction.id },
              data: {
                state: "aborted",
                retries: [...eventTransaction.retries, now],
              },
            });
          } else {
            await prismaClient.eventTransaction.update({
              where: { id: eventTransaction.id },
              data: {
                state: "failed",
                retries: [...eventTransaction.retries, now],
              },
            });
          }
        } catch (error) {
          captureException(error);
        }
      });
    }
  } catch (error) {
    captureException(error);
  }
}

try {
  taskTimer.on(Event.TICK, onTick);
  taskTimer.start();
  console.log("taskTimer.start success");
} catch (error) {
  console.error("on taskTimer start", error);
  throw error;
}

const scheduleMailSchema = z.object({
  eventId: z.string(),
  sender: z
    .string()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") {
        return process.env.SYSTEM_MAIL_SENDER;
      }
      return value;
    }),
  recipient: z.string(),
  subject: z.string(),
  plainText: z.string(),
  html: z.string(),
  scheduledFor: z
    .date()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") {
        return new Date(Date.now() + 1000 * 5); // default to 5 seconds from now to handle deletion of existing transactions for the same eventId, recipient, and subject
      }
      return value;
    }),
});

export async function scheduleMail(options: {
  eventId: string;
  sender?: string;
  recipient: string;
  subject: string;
  plainText: string;
  html: string;
  scheduledFor?: Date;
}) {
  const parsedOptions = scheduleMailSchema.safeParse(options);
  if (parsedOptions.success === false) {
    return { error: parsedOptions.error };
  }

  // Delete any existing transaction for the same eventId, recipient, and subject that is not already sent or aborted
  try {
    const existingTransactions = await prismaClient.eventTransaction.findMany({
      where: {
        eventId: parsedOptions.data.eventId,
        recipient: parsedOptions.data.recipient,
        subject: parsedOptions.data.subject,
        state: { notIn: ["sent", "aborted"] },
      },
    });

    const ids = existingTransactions.map((transaction) => {
      return transaction.id;
    });

    if (existingTransactions.length > 0) {
      await prismaClient.eventTransaction.deleteMany({
        where: { id: { in: ids } },
      });
    }
  } catch (error) {
    captureException(error);
  }

  try {
    await prismaClient.eventTransaction.create({
      data: {
        eventId: parsedOptions.data.eventId,
        sender: parsedOptions.data.sender,
        recipient: parsedOptions.data.recipient,
        subject: parsedOptions.data.subject,
        plainText: parsedOptions.data.plainText,
        html: parsedOptions.data.html,
        scheduledFor: parsedOptions.data.scheduledFor,
      },
    });
  } catch (error) {
    console.error("Error scheduling mail", error);
    return { error };
  }
  return { data: parsedOptions.data, error: null };
}

async function processTransaction(transactionId: string) {
  const transaction = await prismaClient.eventTransaction.findUnique({
    where: { id: transactionId },
  });
  if (transaction === null) {
    return;
  }

  await prismaClient.eventTransaction.update({
    where: { id: transactionId },
    data: { state: "processing" },
  });

  await mailer(
    mailerOptions,
    transaction.sender,
    transaction.recipient,
    transaction.subject,
    transaction.plainText,
    transaction.html
  );

  await prismaClient.eventTransaction.update({
    where: { id: transactionId },
    data: { state: "sent", sentAt: new Date() },
  });
}
