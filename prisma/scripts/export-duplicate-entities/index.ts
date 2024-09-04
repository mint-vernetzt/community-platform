import { prismaClient } from "~/prisma.server";
import {
  exportPossibleOrganizationDuplicates,
  exportPossibleProfileDuplicates,
} from "./utils";

async function main() {
  await exportPossibleOrganizationDuplicates();
  await exportPossibleProfileDuplicates();
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
