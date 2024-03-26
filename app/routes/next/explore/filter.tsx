import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { invariantResponse } from "~/lib/utils/response";
import { FormControl } from "./filter.components";
import { getAllOffers, getFilterCountForSlug } from "./profiles.server";

const sortValues = [
  "firstName-asc",
  "firstName-desc",
  "lastName-asc",
  "lastName-desc",
  "createdAt-desc",
] as const;

const getProfilesSchema = z.object({
  filter: z
    .object({
      offer: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional(),
  sortBy: z
    .enum(sortValues)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return sortValue;
    }),
  page: z.number().optional(),
  search: z.string().optional(),
});

export type GetProfilesSchema = z.infer<typeof getProfilesSchema>;

const i18nNS = ["routes/explore/profiles"];
export const handle = {
  i18n: i18nNS,
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, { schema: getProfilesSchema });

  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  let transformedSubmission;
  if (submission.value.sortBy !== undefined) {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: `${submission.value.sortBy.value}-${submission.value.sortBy.direction}`,
      },
    };
  } else {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: sortValues[0],
      },
    };
  }

  const offers = await getAllOffers();
  const enhancedOffers = offers.map((offer) => {
    // const vectorCount = getFilterCountForSlug(
    //   offer.slug,
    //   filterVector,
    //   "offer"
    // );
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || offer.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.offer.includes(offer.slug);
    }
    return { ...offer, vectorCount: 5, isChecked };
  });
  let selectedOffers: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedOffers = submission.value.filter.offer.map((slug) => {
      const offerMatch = offers.find((offer) => {
        return offer.slug === slug;
      });
      return {
        slug,
        title: offerMatch?.title || null,
      };
    });
  }

  return json({
    submission: transformedSubmission,
    offers: enhancedOffers,
  });
}

function Filter() {
  const i18nNS = ["routes/explore/profiles"];
  const { t } = useTranslation(i18nNS);
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const [form, fields] = useForm<GetProfilesSchema>({
    lastResult: loaderData.submission,
    defaultValue: loaderData.submission.value,
  });

  const filter = fields.filter.getFieldset();

  console.log(loaderData.submission);

  return (
    <>
      <h1>Filter</h1>
      <h1>Sorting</h1>
      <Form
        {...getFormProps(form)}
        method="get"
        onChange={(event) => {
          submit(event.currentTarget, { preventScrollReset: true });
        }}
        preventScrollReset
      >
        <ul role="menu">
          <li role="menuitem">
            <div className="mv-peer mv-inline-flex mv-px-4 mv-py-1.5 mv-gap-2 mv-bg-gray-100 mv-border mv-rounded-lg mv-border-gray-100 focus-within:mv-border-primary-500 focus-within:mv-text-primary-500 mv-font-semibold">
              <label>
                {t("filter.sortBy.label")}
                <input
                  type="checkbox"
                  className="mv-w-0 mv-h-0 mv-opacity-0"
                  onChange={(event) => {
                    event.stopPropagation();
                  }}
                />
              </label>
            </div>
            <div className="mv-hidden peer-has-[:checked]:mv-block focus-within:mv-bg-red-500">
              <fieldset {...getFieldsetProps(fields.sortBy)}>
                {sortValues.map((sortValue) => {
                  return (
                    <div key={sortValue}>
                      <label htmlFor={fields.sortBy.id} className="mr-2">
                        {t(`filter.sortBy.${sortValue}`)}
                      </label>
                      <input
                        {...getInputProps(fields.sortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        defaultChecked={
                          loaderData.submission.value.sortBy === sortValue
                        }
                        disabled={navigation.state === "loading"}
                      />
                    </div>
                  );
                })}
              </fieldset>
            </div>
          </li>
          <li role="menuitem">
            <div className="mv-peer mv-inline-flex mv-px-4 mv-py-1.5 mv-gap-2 mv-bg-gray-100 mv-border mv-rounded-lg mv-border-gray-100 focus-within:mv-border-primary-500 focus-within:mv-text-primary-500 mv-font-semibold">
              <label>
                {t("filter.offer.label")}
                <input
                  type="checkbox"
                  className="mv-w-0 mv-h-0 mv-opacity-0"
                  onChange={(event) => {
                    event.stopPropagation();
                  }}
                />
              </label>
            </div>
            <div className="mv-hidden peer-has-[:checked]:mv-block focus-within:mv-bg-red-500">
              <ul>
                {loaderData.offers.map((offer) => {
                  return (
                    <li key={offer.slug}>
                      <label htmlFor={filter.offer.id} className="mr-2">
                        {offer.title} ({offer.vectorCount})
                      </label>
                      <input
                        {...getInputProps(filter.offer, {
                          type: "checkbox",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: offer.slug || undefined,
                        })}
                        defaultChecked={offer.isChecked}
                        disabled={
                          (offer.vectorCount === 0 && !offer.isChecked) ||
                          navigation.state === "loading"
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        </ul>
      </Form>
    </>
  );
}

export default Filter;
