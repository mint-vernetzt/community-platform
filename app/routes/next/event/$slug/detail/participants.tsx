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
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";

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
      <ListItemContainer>
        {loaderData.participants.map((participant) => {
          return (
            <ListItem key={participant.id} slug={participant.username}>
              <Avatar
                size="full"
                to={`/profile/${participant.username}`}
                {...participant}
              />
              <span>
                {participant.academicTitle !== null &&
                participant.academicTitle.length > 0
                  ? `${participant.academicTitle} `
                  : ""}
                {participant.firstName} {participant.lastName}
              </span>
              {participant.position !== null ? (
                <span>{participant.position}</span>
              ) : null}
            </ListItem>
          );
        })}
      </ListItemContainer>
    </div>
  );
}

import { Children, isValidElement } from "react";

function ListItemContainer(props: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-2 gap-4">{props.children}</ul>;
}

function ListItem(props: { slug: string; children: React.ReactNode }) {
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

  return (
    <div className="flex gap-4 align-center py-4 md:px-4 border-0 md:border border-neutral-200 rounded-lg">
      <div className="flex gap-1">
        <div className="w-12 h-12">{validChildren[0]}</div>
      </div>
      <div className="flex flex-col self-center text-neutral-700">
        <div className="font-semibold line-clamp-1">{validChildren[1]}</div>
        {validChildren.length > 2 ? (
          <div className="font-normal line-clamp-1">{validChildren[2]}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Participants;
