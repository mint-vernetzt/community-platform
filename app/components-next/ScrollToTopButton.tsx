import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { useLocation } from "react-router";
import { DEFAULT_LANGUAGE } from "~/i18n.shared";
import { type RootLocales } from "~/root.server";

function ScrollToTopButton(props: { locales: RootLocales }) {
  const { locales } = props;
  const location = useLocation();

  return (
    <>
      <div className="mv-w-0 mv-h-[80px] xl:mv-h-[84px]"></div>
      <div className="mv-w-0 mv-h-screen mv-sticky mv-top-0">
        <div className="mv-relative mv-w-0 mv-h-screen">
          <div className="mv-absolute mv-bottom-4 -mv-left-20">
            <CircleButton
              as="a"
              href={`${location.pathname}${location.search}#top`}
              size="large"
              floating
              aria-label={
                locales !== undefined
                  ? locales.route.root.scrollToTop
                  : DEFAULT_LANGUAGE === "de"
                  ? "Nach oben scrollen"
                  : "Scroll to top"
              }
            >
              <svg
                width="30"
                height="31"
                viewBox="0 0 30 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 4V29"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M3 13L15 2L27 13"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </CircleButton>
          </div>
        </div>
      </div>
    </>
  );
}

export { ScrollToTopButton };
