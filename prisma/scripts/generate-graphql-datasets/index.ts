import { program } from "commander";
import { gql, request } from "graphql-request";
// @ts-ignore
import fs from "fs/promises";
import { addUuids, GenericEntry } from "./utils";
import {
  dataToBeUpdated,
  entriesOnlyExistingOnDatabase as entriesOnlyExistingOnDataset,
  filterMissingData,
} from "../import-datasets/utils";

const datasetsPath = "prisma/scripts/import-datasets/data/";

program
  .name("graphql-dataset-generator")
  .description(
    `CLI tool to generate .json datasets from a given graphQL url and query options. The datasets are stored inside ${datasetsPath}.`
  )
  .version("1.0.0")
  .requiredOption("-u, --url <char>", "The graphQL URL.")
  .requiredOption(
    "-n, --name <char>",
    "The name of the object to query for. This also specifies the name of the .json dataset."
  )
  .requiredOption(
    "-r, --reference <char>",
    "The id field key of the object to query for, that is used as a reference in the database. (Should not change inside the cms)"
  )
  .option(
    "-f, --fields <char>",
    "Comma seperated field keys of the object to query for (Default: name,slug).",
    "name,slug"
  );

program.parse();

const options = program.opts();

async function main(
  url: string,
  name: string,
  reference: string,
  fields: string
) {
  const query = gql`
  {
    ${name} {
      nodes {
        ${reference}
        ${fields}
      }
    }
  }
`;
  request(url, query)
    .then((data) => {
      // @ts-ignore
      const wantedData = data[name].nodes.map((node) => {
        let transformedNode = {};
        for (let key in node) {
          if (key === "name") {
            // @ts-ignore
            transformedNode["title"] = node[key];
          } else if (key === reference) {
            // @ts-ignore
            transformedNode["referenceId"] = node[key];
          } else {
            // @ts-ignore
            transformedNode[key] = node[key];
          }
        }
        return transformedNode;
      });

      fs.readFile(`${datasetsPath}${name}.json`, {
        encoding: "utf-8",
      })
        // @ts-ignore
        .then((result) => {
          const existingData: GenericEntry[] = JSON.parse(result);
          const wantedDataWithUuids = addUuids(wantedData, existingData);
          const missingData = filterMissingData(
            wantedDataWithUuids,
            existingData
          );
          const entriesToUpdate = dataToBeUpdated(
            wantedDataWithUuids,
            existingData
          );
          const unknownEntries = entriesOnlyExistingOnDataset(
            wantedDataWithUuids,
            existingData
          );
          const newDataset = [...wantedDataWithUuids, ...unknownEntries];

          fs.writeFile(
            `${datasetsPath}${name}.json`,
            JSON.stringify(newDataset)
          )
            .then(() => {
              if (entriesToUpdate.length > 0) {
                console.log(`updated: "${name}"`, entriesToUpdate);
              }
              if (missingData.length > 0) {
                console.log(`added "${name}": `, missingData);
              }
              if (unknownEntries.length > 0) {
                console.log(
                  `warning, unknown "${name}" in dataset ${name}.json: `,
                  unknownEntries
                );
              }
              if (missingData.length === 0 && entriesToUpdate.length === 0) {
                console.log(`dataset ${name}.json is up to date`);
              }
              console.log(`stored ${name}.json inside "${datasetsPath}".`);
            })
            // @ts-ignore
            .catch((error) => {
              console.log(error);
            });
        })
        // @ts-ignore
        .catch((error) => {
          // File not found
          if (error.code === "ENOENT") {
            const newDataset = addUuids(wantedData);
            fs.writeFile(
              `${datasetsPath}${name}.json`,
              JSON.stringify(newDataset)
            ).then(() => {
              console.log(`stored ${name}.json inside "${datasetsPath}"`);
            });
          } else {
            console.log(error);
          }
        });
    })
    // @ts-ignore
    .catch((error) => {
      console.log(error);
    });
}

main(options.url, options.name, options.reference, options.fields);
