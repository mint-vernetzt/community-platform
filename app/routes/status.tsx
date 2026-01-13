import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  type ActionFunctionArgs,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { ConformSelect } from "~/components-next/ConformSelect";
import BasicStructure from "~/components/next/BasicStructure";
import { invariantResponse } from "~/lib/utils/response";
import { transformEmptyToNull } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";

export const loader = async () => {
  const devProfile = await prismaClient.profile.findFirst({
    where: {
      username: "0_developerprofile0-mjbl0zux",
    },
    select: {
      offers: {
        select: {
          offer: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
  invariantResponse(devProfile, "Developer profile not found", { status: 404 });
  const allOffers = await prismaClient.offer.findMany({
    select: {
      title: true,
    },
    orderBy: {
      title: "asc",
    },
  });
  return {
    message: "Server is up and running",
    currentTimestamp: Date.now(),
    offer:
      typeof devProfile.offers.at(0) !== "undefined"
        ? devProfile.offers[0].offer.title
        : null,
    allOffers: allOffers.map((offer) => offer.title),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const formData = await request.formData();
  const submission = await parseWithZod(formData, { schema: testSchema });
  if (submission.status === "success") {
    await prismaClient.profile.update({
      where: {
        username: "0_developerprofile0-mjbl0zux",
      },
      data: {
        offers:
          submission.value.option !== null
            ? {
                deleteMany: {},
                create: {
                  offer: {
                    connect: {
                      title: submission.value.option,
                    },
                  },
                },
              }
            : {
                deleteMany: {},
              },
      },
    });
  }
  return {
    submission: submission.reply(),
  };
};

const testSchema = z.object({
  optionsList: z.array(z.string().trim()),
  option: z.string().trim().optional().transform(transformEmptyToNull),
});

export default function Status() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  const [testForm, testFields] = useForm({
    id: `test-form-${loaderData.currentTimestamp}`,
    constraint: getZodConstraint(testSchema),
    defaultValue: {
      option: loaderData.offer,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: testSchema,
      });
      return submission;
    },
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const optionList = testFields.optionsList.getFieldList();
  const current =
    optionList.length > 0
      ? optionList[optionList.length - 1].initialValue || null
      : loaderData.offer;

  return (
    <BasicStructure>
      <Form
        {...getFormProps(testForm)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <ConformSelect
          id={testFields.optionsList.id}
          cta={current || "Bitte auswählen"}
          closeOnSelect
          dimmed={current === null}
        >
          <ConformSelect.Label htmlFor={testFields.optionsList.id}>
            Single Select
          </ConformSelect.Label>
          {typeof testFields.optionsList.errors !== "undefined" &&
          testFields.optionsList.errors.length > 0 ? (
            testFields.optionsList.errors.map((error) => (
              <ConformSelect.Error
                id={testFields.optionsList.errorId}
                key={error}
              >
                {error}
              </ConformSelect.Error>
            ))
          ) : (
            <ConformSelect.HelperText>Helper Text</ConformSelect.HelperText>
          )}
          <button
            {...testForm.insert.getButtonProps({
              name: testFields.optionsList.name,
              defaultValue: null,
            })}
            {...ConformSelect.getListItemChildrenStyles({
              deemphasized: true,
            })}
          >
            Bitte auswählen
          </button>
          {loaderData.allOffers
            .filter((option) => option !== current)
            .map((option) => {
              return (
                <button
                  key={option}
                  {...testForm.insert.getButtonProps({
                    name: testFields.optionsList.name,
                    defaultValue: option,
                  })}
                  {...ConformSelect.getListItemChildrenStyles()}
                >
                  {option}
                </button>
              );
            })}
        </ConformSelect>
        <input
          type="hidden"
          name={testFields.option.name}
          defaultValue={current || undefined}
          key="option-input"
        />
        <button type="submit">Submit</button>
        <div className="relative w-full">
          <Button
            form={testForm.id}
            type="reset"
            onClick={() => {
              setTimeout(() => testForm.reset(), 0);
            }}
            variant="outline"
            fullSize
            disabled={isHydrated ? testForm.dirty === false : false}
          >
            Reset
          </Button>
          <noscript className="w-full absolute top-0">
            <Button as="link" to="." variant="outline" fullSize>
              Reset
            </Button>
          </noscript>
        </div>
      </Form>
    </BasicStructure>
  );
}
