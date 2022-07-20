import { LoaderFunction } from "remix";
import { badRequest } from "remix-utils";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const url = new URL(request.url);
  const field = url.searchParams.get("name");

  if (field === null) {
    throw badRequest({ message: 'Parameter "name" missing' });
  }

  const values = url.searchParams.getAll("value");

  return {
    [field]: values,
  };
};
