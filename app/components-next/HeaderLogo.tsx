import { DEFAULT_LANGUAGE } from "~/i18n.shared";
import { type RootLocales } from "~/root.server";

export function HeaderLogo(props: { locales?: RootLocales }) {
  return (
    <div className="mv-flex mv-flex-row mv-items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <g fill="none">
          <path
            fill="#154194"
            d="M28 56c15.464 0 28-12.536 28-28S43.464 0 28 0 0 12.536 0 28s12.536 28 28 28"
          />
          <path
            fill="#EFE8E6"
            d="M41.354 25.24c-.43-.89-.998-1.614-1.703-2.17a6.664 6.664 0 0 0-2.447-1.202 11.356 11.356 0 0 0-2.916-.368c-1.358 0-2.532.174-3.524.524-.992.348-1.879.781-2.662 1.298a8.371 8.371 0 0 0-2.681-1.376 10.67 10.67 0 0 0-3.113-.446 14.397 14.397 0 0 0-3.973.543c-1.266.362-2.33.84-3.19 1.434-.523.362-.927.75-1.214 1.163-.288.414-.431.957-.431 1.628v11.98c0 1.085.26 1.816.783 2.19.522.374 1.37.562 2.545.562.573 0 1.096-.033 1.566-.097.47-.065.834-.136 1.096-.213V26.889c.355-.185.72-.347 1.096-.485a4.18 4.18 0 0 1 1.488-.252c.756 0 1.396.2 1.918.6.522.402.783 1.029.783 1.881v9.615c0 1.085.254 1.816.763 2.19.51.374 1.35.562 2.525.562.574 0 1.096-.033 1.566-.097.47-.065.848-.136 1.135-.213V27.897c0-.26-.026-.52-.078-.776a4.99 4.99 0 0 1 1.233-.697 3.95 3.95 0 0 1 1.468-.272c.809 0 1.449.2 1.918.6.47.402.705 1.029.705 1.881v9.615c0 1.085.255 1.816.763 2.19.51.374 1.351.562 2.526.562.573 0 1.096-.033 1.566-.097A9.51 9.51 0 0 0 42 40.69V28.478c0-1.266-.215-2.345-.646-3.237v-.001Z"
          />
          <path
            fill="#B16FAB"
            d="M18.967 17.982C19.612 18.66 20.457 19 21.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504m12 0C31.612 18.66 32.457 19 33.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504"
          />
        </g>
      </svg>
      <span className="mv-hidden lg:mv-block mv-font-bold mv-text-primary mv-ml-2">
        {props.locales !== undefined
          ? props.locales.route.root.community
          : DEFAULT_LANGUAGE === "de"
          ? "Community"
          : "Community"}
      </span>
    </div>
  );
}
