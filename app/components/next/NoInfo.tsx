import { type OrganizationMode } from "~/routes/organization/$slug/utils.server";
import { PencilIconBlankstate } from "./icons/PencilIconBlankstate";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

function NoInfos(props: {
  mode: OrganizationMode;
  locales: {
    blankState: {
      admin: {
        headline: string;
        subline: string;
        cta: string;
      };
      authenticated: {
        info: string;
      };
      anon: {
        info: string;
      };
    };
  };
  ctaLink: string;
}) {
  const { mode, locales, ctaLink } = props;

  return (
    <div className="w-full p-6 rounded-lg bg-neutral-100 border border-neutral-200">
      <div className="w-full flex flex-col items-center gap-4">
        {mode === "admin" ? (
          <>
            <PencilIconBlankstate />
            <p className="w-full text-center text-neutral-700 text-xl font-semibold">
              {locales.blankState.admin.headline}
            </p>
            <p className="w-full text-center text-neutral-700 text-lg">
              {locales.blankState.admin.subline}
            </p>
            <Button variant="outline" as="link" to={ctaLink} prefetch="intent">
              {locales.blankState.admin.cta}
            </Button>
          </>
        ) : mode === "authenticated" ? (
          <p className="w-full text-center text-neutral-700 text-lg leading-6">
            {locales.blankState.authenticated.info}
          </p>
        ) : (
          <p className="w-full text-center text-neutral-700 text-lg leading-6">
            {locales.blankState.anon.info}
          </p>
        )}
      </div>
    </div>
  );
}

export { NoInfos };
