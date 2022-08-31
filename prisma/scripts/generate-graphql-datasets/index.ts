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
  .requiredOption("-u, --url <char>", "The graphQL url")
  .requiredOption(
    "-n, --name <char>",
    "The name of the object to query for. This also specifies the name of the .json dataset"
  )
  .option(
    "-f, --fields <char>",
    "Comma seperated fields of the object to query for (Default: id,slug,name).",
    "id,slug,name"
  );

program.parse();

const options = program.opts();

async function main(url: string, name: string, fields: string) {
  let query = gql`
  {
    ${name} {
      nodes {
        ${fields}
      }
    }
  }
`;

  request(url, query).then((data) => {
    fs.writeFile(
      `prisma/scripts/import-datasets/data/${name}.json`,
      JSON.stringify(data[name].nodes)
    );
    console.log(data[name]);
  });
}

main(options.url, options.name, options.fields);
