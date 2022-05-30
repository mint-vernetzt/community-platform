import main from "./src/index";
import { prismaClient } from "../../../app/prisma";

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
