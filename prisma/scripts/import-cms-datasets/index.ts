import { request, gql } from "graphql-request";
import { createDataset, GenericEntry, TableName } from "../utils";

// TODO: TypeScript
// In the docs the types are defined explicitly like below
interface TData {
  tags: { name: string; tagId: number; slug: string; id: string };
}

const queries: Array<{ tableName: TableName; query: string }> = [
  {
    tableName: "tag",
    query: gql`
      {
        tags {
          nodes {
            name
            tagId
            slug
            id
          }
        }
      }
    `,
  },
];

Promise.all(
  queries.map(
    (query) =>
      new Promise((resolve) => {
        request("https://cms.mint-vernetzt.de/wp/graphql", query.query).then(
          (data: { tags: GenericEntry[] }) => {
            console.log(typeof data.tags);
            console.log("data: ", data.tags);
            console.log("JSON: ", JSON.stringify(data.tags));
            createDataset(data.tags, query.tableName).then(resolve);
          }
        );
      })
  )
)
  .catch((e) => {
    throw e;
  })
  .finally(() => {
    console.log("done.");
  });
