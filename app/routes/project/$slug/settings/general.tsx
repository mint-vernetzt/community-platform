import { LoaderFunction, useLoaderData } from "remix";
import { array, object, string } from "yup";
import { getUserByRequestOrThrow } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  multiline,
  nullOrString,
  phone,
  social,
  website,
} from "~/lib/utils/yup";
import { getDisciplines, getTargetGroups } from "~/utils.server";
import { getProjectBySlugOrThrow } from "../utils.server";
import { checkOwnershipOrThrow, transformProjectToForm } from "./utils.server";

const schema = object({
  userId: string().required(),
  name: string().required(),
  headline: string(),
  excerpt: nullOrString(multiline()),
  description: nullOrString(multiline()),
  email: nullOrString(
    string().email("Deine Eingabe entspricht nicht dem Format einer E-Mail.")
  ),
  phone: nullOrString(phone()),
  website: nullOrString(website()),
  facebook: nullOrString(social("facebook")),
  linkedin: nullOrString(social("linkedin")),
  twitter: nullOrString(social("twitter")),
  youtube: nullOrString(social("youtube")),
  instagram: nullOrString(social("instagram")),
  xing: nullOrString(social("xing")),
  targetGroups: array(string().required()).required(),
  disciplines: array(string().required()).required(),
});

type LoaderData = {
  userId: string;
  project: ReturnType<typeof transformProjectToForm>;
  targetGroups: Awaited<ReturnType<typeof getTargetGroups>>;
  disciplines: Awaited<ReturnType<typeof getDisciplines>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, currentUser);

  const targetGroups = await getTargetGroups();
  const disciplines = await getDisciplines();

  return {
    userId: currentUser.id,
    project: transformProjectToForm(project),
    targetGroups,
    disciplines,
  };
};

function General() {
  const loaderData = useLoaderData<LoaderData>();

  const { project, targetGroups, disciplines } = loaderData;

  const targetGroupOptions = targetGroups
    .filter((targetGroup) => {
      return !project.targetGroups.includes(targetGroup.id);
    })
    .map((targetGroup) => {
      return {
        label: targetGroup.title,
        value: targetGroup.id,
      };
    });

  const selectedTargetGroups =
    project.targetGroups && targetGroups
      ? targetGroups
          .filter((targetGroup) =>
            project.targetGroups.includes(targetGroup.id)
          )
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const disciplineOptions = disciplines
    .filter((discipline) => {
      return !project.disciplines.includes(discipline.id);
    })
    .map((discipline) => {
      return {
        label: discipline.title,
        value: discipline.id,
      };
    });

  const selectedDisciplines =
    project.disciplines && disciplines
      ? disciplines
          .filter((item) => project.disciplines.includes(item.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  return <H1 like="h0">General</H1>;
}

export default General;
