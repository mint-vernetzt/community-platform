import { program } from "commander";
import { gql, request } from "graphql-request";
// @ts-ignore
import fs from "fs/promises";

program
  .name("graphql-dataset-generator")
  .description(
    "CLI tool to generate .json datasets from a given graphQL url and query options. The datasets are stored inside /import-datasets/data/."
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
  let query = gql`
  {
    ${name} {
      nodes {
        ${reference}
        ${fields}
      }
    }
  }
`;

  request(url, query).then((data) => {
    // @ts-ignore
    let transformedData = data[name].nodes.map((node) => {
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

    fs.writeFile(
      `prisma/scripts/import-datasets/data/${name}.json`,
      JSON.stringify(transformedData)
    );
    console.log(
      `generated ${name}.json inside prisma/scripts/import-datasets/data: `,
      transformedData
    );
  });
}

main(options.url, options.name, options.reference, options.fields);
