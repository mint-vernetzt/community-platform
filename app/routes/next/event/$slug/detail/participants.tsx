import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useState } from "react";
import {
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import List from "~/components/next/List";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getParticipantsOfEvent } from "./participants.server";
import {
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";

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

  const [participants, setParticipants] = useState(loaderData.participants);

  const handleChange: React.ChangeEventHandler<HTMLFormElement> = (event) => {
    searchForm.validate();
    if (searchForm.valid) {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const searchValue = formData.get(SEARCH_PARTICIPANTS_SEARCH_PARAM);

      if (searchValue !== null && typeof searchValue === "string") {
        const query = searchValue.trim().split(" ");

        const filteredParticipants = loaderData.participants.filter(
          (participant) => {
            const contains = query.some((term) => {
              return (
                participant.firstName
                  .toLowerCase()
                  .includes(term.toLowerCase()) ||
                participant.lastName
                  .toLowerCase()
                  .includes(term.toLowerCase()) ||
                participant.username.toLowerCase().includes(term.toLowerCase())
              );
            });
            return contains;
          }
        );
        setParticipants(filteredParticipants);
      }
    }
  };

  const handleReset: React.FormEventHandler<HTMLFormElement> = () => {
    setParticipants(loaderData.participants);
  };

  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    defaultValue: {
      [SEARCH_PARTICIPANTS_SEARCH_PARAM]:
        searchParams.get(SEARCH_PARTICIPANTS_SEARCH_PARAM) || undefined,
    },
    constraint: getZodConstraint(getSearchParticipantsSchema()),
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: getSearchParticipantsSchema(),
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
        onChange={handleChange}
        onReset={handleReset}
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
      <List
        id="participants-list"
        hideAfter={4}
        locales={loaderData.locales.route.content}
      >
        {participants.map((participant, index) => {
          return (
            <ListItemPersonOrg key={participant.id} index={index}>
              <ListItemPersonOrg.Avatar
                size="full"
                to={`/profile/${participant.username}`}
                {...participant}
              />
              <ListItemPersonOrg.Headline>
                {participant.academicTitle !== null &&
                participant.academicTitle.length > 0
                  ? `${participant.academicTitle} `
                  : ""}
                {participant.firstName} {participant.lastName}
              </ListItemPersonOrg.Headline>
              {participant.position !== null ? (
                <ListItemPersonOrg.Subline>
                  {participant.position}
                </ListItemPersonOrg.Subline>
              ) : null}
            </ListItemPersonOrg>
          );
        })}
      </List>
    </div>
  );
}

export default Participants;
