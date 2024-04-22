import { PrismaClient } from "@prisma/client";

declare global {
  // TODO: Investigate issue
  var __prismaClient: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prismaClient = new PrismaClient();
} else {
  if (global.__prismaClient === undefined) {
    global.__prismaClient = new PrismaClient({
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "stdout",
          level: "error",
        },
        {
          emit: "stdout",
          level: "info",
        },
        {
          emit: "stdout",
          level: "warn",
        },
      ],
    });
  }
  prismaClient = global.__prismaClient;
}

try {
  console.log(process.env.UNDER_CONSTRUCTION);
  if (process.env.UNDER_CONSTRUCTION === "true") {
    console.log("prismaClient.$connect skipped due to UNDER_CONTRUCTION=true");
  } else {
    await prismaClient.$connect();
    console.log("prismaClient.$connect success");
  }
} catch (error) {
  console.error("on prismaClient $connect", error);
  throw error;
}

export { prismaClient };
