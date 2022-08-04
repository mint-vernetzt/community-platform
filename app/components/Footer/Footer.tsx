import { Link } from "remix";

export interface FooterProps {
  isDifferentFooterRoute: boolean;
}

function Footer(props: FooterProps) {
  const { isDifferentFooterRoute } = props;
  return (
    <div
      className={`footer-section py-4 lg:py-4 border-t border-neutral-400 overflow-hidden ${
        isDifferentFooterRoute && "mb-16 md:mb-28"
      }`.trimEnd()}
    >
      <div className="container">
        <div className="flex">
          <ul className="flex-100 md:flex-auto md:justify-end meta_nav md:flex text-neutral-600 text-sm leading-4 font-semibold">
            <li className="pb-4 md:pb-0 md:pr-4 xl:pr-8">
              <Link
                to="imprint"
                target="_blank"
                className="block hover:underline hover:text-primary"
              >
                Impressum
              </Link>
            </li>
            <li className="pb-4 md:pb-0 md:pr-4 xl:pr-8">
              <a
                href="https://mint-vernetzt.de/privacy-policy-community-platform"
                target="_blank"
                rel="noreferrer"
                className="block hover:underline hover:text-primary"
              >
                Datenschutzerklärung
              </a>
            </li>
            <li className="pb-4 md:pb-0 md:pr-4 xl:pr-8">
              <a
                href="https://mint-vernetzt.de/terms-of-use-community-platform"
                target="_blank"
                rel="noreferrer"
                className="block hover:underline hover:text-primary"
              >
                Nutzungsbedingungen
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Footer;
