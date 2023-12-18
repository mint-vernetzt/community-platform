import { type Params } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";

export function getParamValue(params: Params<string>, key: string) {
  const value = params[key];
  return value;
}

export function getParamValueOrThrow(params: Params<string>, key: string) {
  const result = getParamValue(params, key);
  if (result === undefined || typeof result !== "string") {
    throw json({ message: `"${key}" missing` }, { status: 400 });
  }
  return result;
}
