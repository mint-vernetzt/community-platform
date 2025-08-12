import { prismaClient } from "~/prisma.server";

async function main() {
  const updateQueries = [];

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      city: true,
      street: true,
      streetNumber: true,
      zipCode: true,
    },
  });

  for (const organization of organizations) {
    const searchParams = new URLSearchParams();
    if (organization.street !== null && organization.streetNumber !== null) {
      searchParams.set(
        "street",
        `${organization.street} ${organization.streetNumber}`
      );
    } else if (organization.street !== null) {
      searchParams.set("street", organization.street);
    }
    if (organization.city !== null) {
      searchParams.set("city", organization.city);
    }
    if (organization.zipCode !== null) {
      searchParams.set("postalcode", organization.zipCode);
    }
    if (searchParams.toString() === "") {
      console.log(
        `No address information available for organization ${organization.id}. Skipping...`
      );
      continue;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams.toString()}&format=jsonv2`,
      {
        method: "GET",
      }
    );
    if (response.status !== 200) {
      console.error(
        `Error fetching location for organization ${organization.id}: ${response.statusText}`
      );
      continue;
    }

    const locationJSON = await response.json();

    if (Array.isArray(locationJSON) === false) {
      console.error(
        `Unexpected response format for organization ${organization.id}: JSON object is not an array`,
        locationJSON
      );
      continue;
    }
    if (locationJSON.length === 0) {
      console.error(
        `No location found for organization ${organization.id}`,
        locationJSON
      );
      continue;
    }
    if (
      "lat" in locationJSON[0] === false ||
      "lon" in locationJSON[0] === false
    ) {
      console.error(
        `Location JSON does not contain latitude and longitude for organization ${organization.id}`,
        locationJSON
      );
      continue;
    }
    if (locationJSON.length > 1) {
      console.warn(
        `Multiple locations found for organization ${organization.id}. The first was taken:`,
        locationJSON[0]
      );
    }
    const { lat, lon } = locationJSON[0];
    if (typeof lat !== "string" || typeof lon !== "string") {
      console.error(
        `Latitude and longitude are not strings for organization ${organization.id}`,
        { lat, lon }
      );
      continue;
    }

    updateQueries.push(
      prismaClient.organization.update({
        where: { id: organization.id },
        data: {
          latitude: lat,
          longitude: lon,
        },
      })
    );
  }
  await prismaClient.$transaction(updateQueries);
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
