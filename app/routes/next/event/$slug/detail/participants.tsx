import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getParticipantsOfEvent } from "./participants.server";
import {
  getSearchParticipantsSchmema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/detail/participants"];

  const { slug } = params;

  invariantResponse(typeof slug !== "undefined", "slug not found", {
    status: 400,
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, participants } = await getParticipantsOfEvent({
    slug,
    authClient,
    sessionUser,
    searchParams,
  });

  return { submission, participants, locales };
}

function Participants() {
  const loaderData = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    defaultValue: {
      [SEARCH_PARTICIPANTS_SEARCH_PARAM]:
        searchParams.get(SEARCH_PARTICIPANTS_SEARCH_PARAM) || undefined,
    },
    constraint: getZodConstraint(getSearchParticipantsSchmema()),
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: getSearchParticipantsSchmema(),
      });
    },
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-neutral-700 text-xl font-bold leading-6">
        {loaderData.locales.route.content.title}
      </h3>
      <Form
        {...getFormProps(searchForm)}
        method="get"
        preventScrollReset
        onChange={(event) => {
          searchForm.validate();
          if (searchForm.valid) {
            submit(event.currentTarget, {
              preventScrollReset: true,
            });
          }
        }}
        autoComplete="off"
      >
        <Input name={Deep} defaultValue="true" type="hidden" />
        <Input
          {...getInputProps(searchFields[SEARCH_PARTICIPANTS_SEARCH_PARAM], {
            type: "text",
          })}
          key={searchFields[SEARCH_PARTICIPANTS_SEARCH_PARAM].id}
          placeholder={loaderData.locales.route.content.search}
          standalone
        >
          <Input.Label
            htmlFor={searchFields[SEARCH_PARTICIPANTS_SEARCH_PARAM].id}
            hidden
          >
            {loaderData.locales.route.content.search}
          </Input.Label>
          <Input.SearchIcon />
          <Input.ClearIcon />
          <noscript>
            <Input.Controls>
              <Button type="submit">
                {loaderData.locales.route.content.search}
              </Button>
            </Input.Controls>
          </noscript>
        </Input>
      </Form>
      <ul className="grid grid-cols-2 gap-4">
        {loaderData.participants.map((participant) => (
          <li
            key={participant.id}
            className="col-span-2 @lg:col-span-1 flex items-center justify-between"
          >
            <span className="text-neutral-700">
              {participant.firstName} {participant.lastName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Participants;
