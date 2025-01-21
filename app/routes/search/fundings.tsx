import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { FundingCard } from "~/components-next/FundingCard";
import {
  countSearchedFundings,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchFundingsViaLike,
} from "./utils.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";
import { prismaClient } from "~/prisma.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request, {
    itemsPerPage: 6,
  });

  let fundingsCount: Awaited<ReturnType<typeof countSearchedFundings>>;
  let fundings: Awaited<ReturnType<typeof searchFundingsViaLike>>;
  if (searchQuery.length === 0) {
    fundingsCount = 0;
    fundings = [];
  } else {
    const fundingsCountQuery = countSearchedFundings(searchQuery);
    const rawFundingsQuery = searchFundingsViaLike(searchQuery, take);
    const [fundingsCountResult, rawFundingsResult] =
      await prismaClient.$transaction([fundingsCountQuery, rawFundingsQuery]);
    fundingsCount = fundingsCountResult;
    fundings = rawFundingsResult;
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search/fundings"];

  return {
    fundings,
    count: fundingsCount,
    pagination: { page, itemsPerPage },
    locales,
  };
}

function SearchFundings() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
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
                  <FundingCard
                    key={funding.url}
                    url={funding.url}
                    locales={locales}
                  >
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
                      locales={locales}
                    >
                      <FundingCard.Category.Title>
                        {locales.card.region}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>
                    <FundingCard.Category
                      items={funding.sourceEntities}
                      locales={locales}
                    >
                      <FundingCard.Category.Title>
                        {locales.card.eligibleEntity}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>

                    <FundingCard.Category
                      items={funding.sourceAreas}
                      locales={locales}
                    >
                      <FundingCard.Category.Title>
                        {locales.card.area}
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
                    {locales.more}
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-primary">{locales.empty}</p>
        )}
      </section>
    </>
  );
}

export default SearchFundings;
