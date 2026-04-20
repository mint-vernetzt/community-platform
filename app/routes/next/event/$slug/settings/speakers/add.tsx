import { type LoaderFunctionArgs } from "react-router";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers/add"];

  return {
    locales,
  };
}

function AddSpeaker() {
  return <>Add Speaker</>;
}

export default AddSpeaker;
