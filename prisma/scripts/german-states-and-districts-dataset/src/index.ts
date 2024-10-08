import https from "https";
import type { Area, District, DistrictType, State } from "@prisma/client";
import { prismaClient } from "../../../../app/prisma.server";
import { generateValidSlug } from "~/utils.server";

// The main function, which is called by the cli (load-german-states-and-districts.ts)
export async function main(
  apiUrl?: string,
  filePath?: string,
  stateKey = "state",
  districtKey = "county",
  verbose: boolean = false
) {
  if (apiUrl) {
    // Makes a http request to the corona API and passes on the response body to evaluateJsonObject()
    await https
      .get(apiUrl, async (res: any) => {
        let data: any = [];

        res.on("data", (chunk: any) => {
          data.push(chunk);
        });

        res.on("end", async () => {
          const corona = JSON.parse(Buffer.concat(data).toString());

          await writeToDatabase(
            evaluateJsonObject(corona.data, stateKey, districtKey),
            verbose
          );
          return await logStates(verbose);
        });
      })
      .on("error", (err: Error) => {
        console.log("Error: ", err.message);
      });
  } else if (filePath) {
    // Imports the districts from the specified file and passes them on to evaluateJsonObject()
    // @ts-ignore
    const localities = await import(filePath).then((module) => module.default);

    await writeToDatabase(
      evaluateJsonObject(localities.data, stateKey, districtKey),
      verbose
    );
    return await logStates(verbose);
  } else {
    console.log("Please specify either an API URL or a file path.");
  }
}

// Loop through a json object and convert the attributes to objects and store them in an array
// Expected structure:
/*
{
    ags1: {
        stateKey: string,
        districtKey: string,
        ...
    },
    ags2: {
        stateKey: string,
        districtKey: string,
        ...
    },
    ...
}
*/

export function extractDistrictType(district: District): {
  name: string;
  type: DistrictType;
} {
  let type: DistrictType = "land";
  let name = district.name;

  if (name.startsWith("SK")) {
    type = "urban";
  }

  if (name.startsWith("SK") || name.startsWith("LK")) {
    name = name.substring(3);
  }

  return { name, type };
}

export function evaluateJsonObject(
  jsonObject: Object,
  stateKey: string,
  districtKey: string
): { districts: District[]; states: State[] } {
  let states: State[] = [];
  let districts: District[] = [];

  for (const [key, value] of Object.entries(jsonObject)) {
    if (key.length != 5 || isNaN(Number(key))) {
      throw new Error("Invalid ags: " + key);
    }
    if (
      states.filter((filterState) => filterState.agsPrefix == key.slice(0, 2))
        .length == 0
    ) {
      if (!value[stateKey]) {
        throw new Error("Invalid stateKey: " + stateKey);
      }

      states.push({ name: value[stateKey], agsPrefix: key.slice(0, 2) });
    }
    if (
      districts.filter((filterDistrict) => filterDistrict.ags == key).length ==
      0
    ) {
      if (!value[districtKey]) {
        throw new Error("Invalid districtKey: " + districtKey);
      }

      let type: DistrictType = "land";
      let name = value.name;

      if (value.county.startsWith("SK")) {
        type = "urban";
      }

      districts.push({
        name,
        type,
        ags: key,
        stateAgsPrefix: key.slice(0, 2),
      });
    }
  }

  // Check if there are states with the same name but different ags prefixes
  for (let i = 0; i < states.length; i++) {
    for (let j = 0; j < states.length; j++) {
      if (i != j && states[i].name == states[j].name) {
        throw new Error(
          "There are states with the same name but different ags prefixes: " +
            states[i].name +
            " (" +
            states[i].agsPrefix +
            ") and " +
            states[j].name +
            " (" +
            states[j].agsPrefix +
            ")"
        );
      }
    }
  }

  // Check if there are districts with the same name but different ags
  for (let i = 0; i < districts.length; i++) {
    for (let j = 0; j < districts.length; j++) {
      if (i != j && districts[i].name == districts[j].name) {
        if (
          districts[i].name === districts[j].name &&
          districts[i].type === districts[j].type
        ) {
          console.log(districts[i], districts[j]);
          throw new Error(
            "There are districts with the same name but different ags: " +
              districts[i].name +
              " (" +
              districts[i].ags +
              ") and " +
              districts[j].name +
              " (" +
              districts[j].ags +
              "), maybe use a different districtKey?"
          );
        } else {
          if (districts[i].type === "land") {
            districts[i].name = `${districts[i].name} (Landkreis)`;
          }
          if (districts[j].type === "land") {
            districts[j].name = `${districts[j].name} (Landkreis)`;
          }
        }
      }
    }
  }

  return { states: states, districts: districts };
}

function hashFunction(slug: string) {
  const random = Math.floor(Math.random() * 1000000);
  const stringFromRandom = random.toString(36);
  return `${slug}-${stringFromRandom}`;
}

// @ts-ignore
export function getAreas(districts, states, countries) {
  let areas: Area[] = [];
  // @ts-ignore
  districts.forEach((district) => {
    const area = {
      name: district.name,
      slug: generateValidSlug(district.name, { hashFunction }),
      type: "district",
      stateId: district.stateAgsPrefix,
    };
    // @ts-ignore
    areas.push(area);
  });
  // @ts-ignore
  states.forEach((state) => {
    const area = {
      name: state.name,
      slug: generateValidSlug(state.name, { hashFunction }),
      type: "state",
      stateId: state.agsPrefix,
    };
    // @ts-ignore
    areas.push(area);
  });
  // @ts-ignore

  countries.forEach((country) => {
    const area = {
      name: country.name,
      slug: generateValidSlug(country.name, { hashFunction }),
      type: "country",
      stateId: null,
    };
    // @ts-ignore
    areas.push(area);
  });

  // @ts-ignore
  areas.push({
    name: "Bundesweit",
    slug: generateValidSlug("Bundesweit"),
    type: "country",
    stateId: null,
  });

  // @ts-ignore
  areas.push({
    name: "International",
    slug: generateValidSlug("international"),
    type: "global",
    stateId: null,
  });

  return areas;
}

// Prepare the data for writeToDatabase() so that it can efficiently be written to with bulk insert, update, or delete
export function prepareQueries(
  current: { states: any[]; districts: any[]; areas: Area[] },
  data: { states: any[]; districts: any[] }
) {
  const currentDistricts = current.districts;
  const currentStates = current.states;
  const currentAreas = current.areas;

  let areas: Area[] = getAreas(data.districts, data.states, []);
  console.log({ areas });

  // Sort the new states and districts into the categories create, update and delete
  const insertDistricts = data.districts.filter(
    (district) =>
      currentDistricts.filter(
        (filterDistrict) => filterDistrict.ags == district.ags
      ).length == 0
  );

  const insertStates = data.states.filter(
    (state) =>
      currentStates.filter(
        (filterState) => filterState.agsPrefix == state.agsPrefix
      ).length == 0
  );
  const insertAreas = areas.filter((area) => {
    const index = currentAreas.findIndex(
      (currentArea) =>
        currentArea.name === area.name &&
        currentArea.stateId === area.stateId &&
        currentArea.type === area.type
    );
    return index === -1;
  });

  const updateStates = data.states.filter(
    (state) =>
      currentStates.filter(
        (filterState) =>
          filterState.agsPrefix == state.agsPrefix &&
          filterState.name != state.name
      ).length > 0
  );
  const updateDistricts = data.districts.filter(
    (district) =>
      currentDistricts.filter(
        (filterDistrict) =>
          filterDistrict.ags == district.ags &&
          (filterDistrict.name != district.name ||
            filterDistrict.stateAgsPrefix != district.stateAgsPrefix)
      ).length > 0
  );

  const deleteDistricts = currentDistricts.filter(
    (district) =>
      data.districts.filter(
        (filterDistrict) => filterDistrict.ags == district.ags
      ).length == 0
  );
  const deleteStates = currentStates.filter(
    (state) =>
      data.states.filter(
        (filterState) => filterState.agsPrefix == state.agsPrefix
      ).length == 0
  );

  return {
    insertDistricts: insertDistricts,
    insertStates: insertStates,
    insertAreas: insertAreas,
    updateStates: updateStates,
    updateDistricts: updateDistricts,
    deleteDistricts: deleteDistricts,
    deleteStates: deleteStates,
  };
}

// Intelligently write the states and districts to the database
export async function writeToDatabase(
  data: { states: any[]; districts: any[] },
  verbose = false
) {
  const currentDistricts = await prismaClient.district.findMany();
  const currentStates = await prismaClient.state.findMany();
  const currentAreas = await prismaClient.area.findMany();

  const queries = prepareQueries(
    { states: currentStates, districts: currentDistricts, areas: currentAreas },
    data
  );

  // Delete the states and districts that are not in the new data
  await prismaClient.district.deleteMany({
    where: {
      ags: {
        in: queries.deleteDistricts.map((district) => district.ags),
      },
    },
  });
  await prismaClient.state.deleteMany({
    where: {
      agsPrefix: {
        in: queries.deleteStates.map((state) => state.agsPrefix),
      },
    },
  });
  verbose &&
    console.log(
      "Deleted " +
        queries.deleteStates.length +
        " states and " +
        queries.deleteDistricts.length +
        " districts"
    );

  // Update the states and districts that are in the new data
  const stateUpdates = [];
  for (const state of queries.updateStates) {
    stateUpdates.push(
      prismaClient.state.update({
        where: {
          agsPrefix: state.agsPrefix,
        },
        data: {
          name: state.name,
        },
      })
    );
  }
  const districtUpdates = [];
  for (const district of queries.updateDistricts) {
    districtUpdates.push(
      prismaClient.district.update({
        where: {
          ags: district.ags,
        },
        data: {
          name: district.name,
          stateAgsPrefix: district.stateAgsPrefix,
        },
      })
    );
  }
  await prismaClient.$transaction([...stateUpdates, ...districtUpdates]);
  verbose &&
    console.log(
      "Updated " +
        queries.updateStates.length +
        " states and " +
        queries.updateDistricts.length +
        " districts"
    );

  // Write all new states and districts to the database
  await prismaClient.state.createMany({
    data: queries.insertStates,
  });
  await prismaClient.district.createMany({
    data: queries.insertDistricts,
  });
  await prismaClient.area.createMany({
    data: queries.insertAreas,
  });
  verbose &&
    console.log(
      "Created " +
        queries.insertStates.length +
        " states and " +
        queries.insertDistricts.length +
        " districts" +
        queries.insertAreas +
        " areas"
    );
}

export async function logStates(verbose: boolean) {
  // Get all states together with their districts and log them
  const allStates = await prismaClient.state.findMany({
    include: {
      districts: true,
    },
  });
  if (verbose) {
    console.log("\nAll states with their districts:");
    console.dir(allStates, { depth: null });
  } else {
    return allStates;
  }
}
