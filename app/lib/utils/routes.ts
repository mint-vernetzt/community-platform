import { Params } from "react-router";
import { badRequest } from "remix-utils";

export function getParamValue(params: Params<string>, key: string) {
  const value = params[key];
  return value;
}

export function getParamValueOrThrow(params: Params<string>, key: string) {
  const result = getParamValue(params, key);
  if (result === undefined || typeof result !== "string") {
    throw badRequest({ message: `"${key}" missing` });
  }
  return result;
}
