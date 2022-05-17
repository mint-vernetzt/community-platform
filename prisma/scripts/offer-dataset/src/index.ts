import { Offer } from "@prisma/client";
import { prismaClient } from "../../../../app/prisma";
import wantedOffers from "../data/offer.json";

export type OfferLookup = {
  [keyof: string]: Offer;
};

export function shallowComparison<T>(obj1: T, obj2: T) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
      return (
        Object.prototype.hasOwnProperty.call(obj2, key) &&
        obj1[key] === obj2[key]
      );
    })
  );
}

export function filterMissingData(
  wantedOffers: Offer[],
  existingOffers: Offer[]
) {
  const existingOfferIds = existingOffers.map((o) => o.id);
  return wantedOffers.filter((wanted) => !existingOfferIds.includes(wanted.id));
}

export function makeLookup(offers: Offer[]) {
  return offers.reduce((offer, value) => {
    offer[value.id] = value;
    return offer;
  }, {} as OfferLookup);
}

export function dataToBeUpdated(
  wantedOffers: Offer[],
  existingOffers: Offer[]
) {
  // create object of {uuid1: {id: uuid1, title: title1}, uuid2: {id: uuid2, title: title2}, ... }
  const existingLookup = makeLookup(existingOffers);

  return wantedOffers.filter((wanted) => {
    const existing = existingLookup[wanted.id] !== undefined;
    return (
      existing && !shallowComparison<Offer>(existingLookup[wanted.id], wanted)
    );
  });
}

export function dataOnlyExisting(
  wantedOffers: Offer[],
  existingOffers: Offer[]
) {
  const wantedLookup = makeLookup(wantedOffers);

  return existingOffers.filter(
    (existing) => wantedLookup[existing.id] === undefined
  );
}

async function main() {
  const existingOffers = await prismaClient.offer.findMany();
  const missingData = filterMissingData(wantedOffers, existingOffers);

  if (missingData.length > 0) {
    await prismaClient.offer.createMany({ data: missingData });
    console.log("added: ", missingData);
  }

  const offersToUpdate = dataToBeUpdated(wantedOffers, existingOffers);
  if (offersToUpdate.length > 0) {
    offersToUpdate.forEach(async ({ id, title }) => {
      await prismaClient.offer.update({
        where: {
          id,
        },
        data: {
          title,
        },
      });
    });

    console.log("updated: ", offersToUpdate);
  }

  const unknownOffers = dataOnlyExisting(wantedOffers, existingOffers);
  if (unknownOffers.length > 0) {
    console.log("warning, unknown offers in db: ", unknownOffers);
  }

  if (missingData.length === 0 && offersToUpdate.length === 0) {
    console.log("offer data is up to date");
  }
}

export default main;
