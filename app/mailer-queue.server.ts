import { captureException } from "@sentry/node";
import { promise as queue, type queueAsPromised } from "fastq";
import { Event, TaskTimer } from "tasktimer";
import { z } from "zod";
import { mailer, mailerOptions } from "./mailer.server";
import { prismaClient } from "./prisma.server";

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
    global.__taskTimer = new TaskTimer({ interval: 1000 }); // 1 second interval in development and test
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
  try {
    const eventTransactions = await prismaClient.eventTransaction.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        state: { notIn: ["sent", "aborted", "processing"] },
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
        return new Date();
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
