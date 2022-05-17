import { prismaClient } from "../../../../app/prisma";
import wantedOffers from "../data/offer.json";

type OfferData = {
  id: string;
  title: string;
};

function filterMissingData(
  wantedOffers: OfferData[],
  existingOfferIds: OfferData["id"][]
) {
  return wantedOffers.filter((wanted) => !existingOfferIds.includes(wanted.id));
}

async function main() {
  const existingOffers = await prismaClient.offer.findMany();
  const missingData = filterMissingData(
    wantedOffers,
    existingOffers.map((o) => o.id)
  );
  if (missingData.length > 0) {
    await prismaClient.offer.createMany({ data: missingData });
    console.log("added", missingData);
  } else {
    console.log("there is already offer data in the schema");
  }
}

export default main;
