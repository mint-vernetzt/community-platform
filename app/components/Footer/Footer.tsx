import { Link } from "react-router";

export interface FooterProps {
  isDifferentFooterRoute: boolean;
  isNonAppBaseRoute: boolean;
}

function Footer(props: FooterProps) {
  const { isDifferentFooterRoute, isNonAppBaseRoute } = props;
  return (
    <div
      className={`footer-section py-4 lg:py-4 border-t border-neutral-400 overflow-hidden ${
        isDifferentFooterRoute
          ? "mb-16 md:mb-28"
          : !isNonAppBaseRoute &&
            "md:fixed md:inset-x-0 md:bottom-0 bg-white z-20"
      }`.trimEnd()}
    >
      <div className="container">
        <div
          className={`flex ${
            isNonAppBaseRoute && "flex-row -mx-4 justify-end"
          }`.trimEnd()}
        >
          <div
            className={`${
              isNonAppBaseRoute
                ? "basis-full md:basis-6/12 px-4"
                : "flex flex-100"
            }`}
          >
            <ul
              className={`flex-100 md:flex-auto meta_nav text-neutral-600 text-sm leading-4 font-semibold ${
                isNonAppBaseRoute
                  ? "md:justify-center"
                  : "md:flex md:justify-end"
              }`.trimEnd()}
            >
              {/* <ul className="flex-100 md:flex-auto md:justify-end meta_nav md:flex <-- text-neutral-600 text-sm leading-4 font-semibold"> */}
              <li
                className={`pb-4 ${
                  !isNonAppBaseRoute && "md:pb-0 md:pr-4 xl:pr-8"
                }`.trimEnd()}
              >
                {/* <li className="pb-4 md:pb-0 md:pr-4 xl:pr-8"> */}
                <Link
                  to="imprint"
                  target="_blank"
                  className="block hover:underline hover:text-primary"
                >
                  Impressum
                </Link>
              </li>
              <li
                className={`pb-4 ${
                  !isNonAppBaseRoute && "md:pb-0 md:pr-4 xl:pr-8"
                }`.trimEnd()}
              >
                <a
                  href="https://mint-vernetzt.de/privacy-policy-community-platform"
                  target="_blank"
                  rel="noreferrer noopenner"
                  className="block hover:underline hover:text-primary"
                >
                  Datenschutzerklärung
                </a>
              </li>
              <li
                className={`pb-4 ${
                  !isNonAppBaseRoute && "md:pb-0 md:pr-4 xl:pr-8"
                }`.trimEnd()}
              >
                <a
                  href="https://mint-vernetzt.de/terms-of-use-community-platform"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block hover:underline hover:text-primary"
                >
                  Nutzungsbedingungen
                </a>
              </li>
              <li>
                Benötigst Du Hilfe? Melde dich bei{" "}
                <a
                  href="mailto:support@mint-vernetzt.de"
                  className="hover:underline hover:text-primary"
                >
                  support@mint-vernetzt.de
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
