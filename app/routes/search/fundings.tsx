import { Button } from "@mint-vernetzt/components";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { FundingCard } from "../explore/__components";
import {
  countSearchedFundings,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchFundingsViaLike,
} from "./utils.server";

const i18nNS = ["routes-search-fundings", "routes-explore-fundings"] as const;
export const handle = {
  i18n: i18nNS,
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request, {
    itemsPerPage: 6,
  });

  const fundings = await searchFundingsViaLike(searchQuery, take);
  const fundingsCount = await countSearchedFundings(searchQuery);

  return json({
    fundings,
    count: fundingsCount,
    pagination: { page, itemsPerPage },
  });
}

function SearchFundings() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);

  return (
    <>
      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {loaderData.fundings.length > 0 ? (
          <>
            <FundingCard.Container>
              {loaderData.fundings.map((funding) => {
                return (
                  <FundingCard key={funding.url} url={funding.url}>
                    <FundingCard.Subtitle>
                      {funding.types
                        .map((relation) => {
                          return relation.type.title;
                        })
                        .join(", ")}
                    </FundingCard.Subtitle>
                    <FundingCard.Title>{funding.title}</FundingCard.Title>
                    <FundingCard.Category
                      items={funding.regions.map((relation) => {
                        return relation.area.name;
                      })}
                    >
                      <FundingCard.Category.Title>
                        {t("card.region")}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>
                    <FundingCard.Category items={funding.sourceEntities}>
                      <FundingCard.Category.Title>
                        {t("card.eligibleEntity")}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>

                    <FundingCard.Category items={funding.sourceAreas}>
                      <FundingCard.Category.Title>
                        {t("card.area")}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>
                  </FundingCard>
                );
              })}
            </FundingCard.Container>

            {loaderData.count > loaderData.fundings.length && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 @md:mv-mb-24 @lg:mv-mb-8 mv-mt-4 @lg:mv-mt-8">
                <Link
                  to={`?${loadMoreSearchParams.toString()}`}
                  preventScrollReset
                  replace
                >
                  <Button
                    size="large"
                    variant="outline"
                    loading={navigation.state === "loading"}
                    disabled={navigation.state === "loading"}
                  >
                    {t("more")}
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-primary">{t("empty")}</p>
        )}
      </section>
    </>
  );
}

export default SearchFundings;
