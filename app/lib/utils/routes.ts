import { type Params } from "@remix-run/react";
import { invariantResponse } from "./response";

export function getParamValue(params: Params<string>, key: string) {
  const value = params[key];
  return value;
}

export function getParamValueOrThrow(params: Params<string>, key: string) {
  const result = getParamValue(params, key);
  if (result === undefined || typeof result !== "string") {
    invariantResponse(false, `"${key}" missing`, { status: 400 });
  }
  return result;
}
