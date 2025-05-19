import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Form, Link, useLocation } from "react-router";
import Cookies from "js-cookie";
import { useHydrated } from "remix-utils/use-hydrated";
import { type RootLocales } from "~/root.server";
import { useEffect, useState } from "react";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export function LoginOrRegisterCTA(props: {
  isAnon?: boolean;
  locales: RootLocales;
}) {
  const { isAnon = false, locales } = props;
  const location = useLocation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();

  const [hideLoginOrRegisterCookie, setHideLoginOrRegisterCookie] =
    useState(false);
  useEffect(() => {
    const cookie = Cookies.get("mv-hide-login-or-register-cta");
    if (cookie === "true") {
      setHideLoginOrRegisterCookie(true);
    } else {
      setHideLoginOrRegisterCookie(false);
    }
  }, []);

  if (isAnon === false || hideLoginOrRegisterCookie) {
    return null;
  }

  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-w-full mv-px-6 mv-py-6 mv-text-primary mv-bg-primary-50">
      <div className="mv-flex mv-justify-between mv-w-full">
        <p className="mv-block mv-font-semibold">
          {locales.route.root.loginOrRegisterCTA.info}
        </p>

        <Form
          action={`${location.pathname}${location.search}`}
          method="get"
          onSubmit={(event) => {
            event.stopPropagation();
            event.preventDefault();
            Cookies.set("mv-hide-login-or-register-cta", "true", {
              expires: 1,
            });
            setHideLoginOrRegisterCookie(true);
          }}
          className={`${isHydrated ? "mv-opacity-100" : "mv-opacity-0"}`}
        >
          <button type="submit" disabled={isSubmitting}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5.80752 5.80752C5.86558 5.74931 5.93454 5.70314 6.01048 5.67163C6.08641 5.64012 6.16781 5.6239 6.25002 5.6239C6.33223 5.6239 6.41363 5.64012 6.48956 5.67163C6.56549 5.70314 6.63446 5.74931 6.69252 5.80752L10 9.11627L13.3075 5.80752C13.3656 5.74941 13.4346 5.70331 13.5105 5.67186C13.5865 5.64042 13.6678 5.62423 13.75 5.62423C13.8322 5.62423 13.9136 5.64042 13.9895 5.67186C14.0654 5.70331 14.1344 5.74941 14.1925 5.80752C14.2506 5.86563 14.2967 5.93461 14.3282 6.01054C14.3596 6.08646 14.3758 6.16784 14.3758 6.25002C14.3758 6.3322 14.3596 6.41357 14.3282 6.4895C14.2967 6.56542 14.2506 6.63441 14.1925 6.69252L10.8838 10L14.1925 13.3075C14.2506 13.3656 14.2967 13.4346 14.3282 13.5105C14.3596 13.5865 14.3758 13.6678 14.3758 13.75C14.3758 13.8322 14.3596 13.9136 14.3282 13.9895C14.2967 14.0654 14.2506 14.1344 14.1925 14.1925C14.1344 14.2506 14.0654 14.2967 13.9895 14.3282C13.9136 14.3596 13.8322 14.3758 13.75 14.3758C13.6678 14.3758 13.5865 14.3596 13.5105 14.3282C13.4346 14.2967 13.3656 14.2506 13.3075 14.1925L10 10.8838L6.69252 14.1925C6.63441 14.2506 6.56542 14.2967 6.4895 14.3282C6.41357 14.3596 6.3322 14.3758 6.25002 14.3758C6.16784 14.3758 6.08646 14.3596 6.01054 14.3282C5.93461 14.2967 5.86563 14.2506 5.80752 14.1925C5.74941 14.1344 5.70331 14.0654 5.67186 13.9895C5.64042 13.9136 5.62423 13.8322 5.62423 13.75C5.62423 13.6678 5.64042 13.5865 5.67186 13.5105C5.70331 13.4346 5.74941 13.3656 5.80752 13.3075L9.11627 10L5.80752 6.69252C5.74931 6.63446 5.70314 6.56549 5.67163 6.48956C5.64012 6.41363 5.6239 6.33223 5.6239 6.25002C5.6239 6.16781 5.64012 6.08641 5.67163 6.01048C5.70314 5.93454 5.74931 5.86558 5.80752 5.80752Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </Form>
      </div>
      <div className="mv-flex mv-w-full mv-gap-4 mv-items-baseline">
        <Link
          to={`/login?login_redirect=${location.pathname}`}
          className="mv-text-primary mv-font-semibold hover:mv-underline mv-flex-grow @sm:mv-flex-grow-0"
        >
          <Button variant="outline" fullSize>
            {locales.route.root.loginOrRegisterCTA.login}
          </Button>
        </Link>
        <p className="mv-text-xs mv-flex-grow-0">
          {locales.route.root.loginOrRegisterCTA.or}
        </p>
        <Link
          to={`/register?login_redirect=${location.pathname}`}
          className="mv-text-primary mv-font-semibold hover:mv-underline mv-flex-grow @sm:mv-flex-grow-0"
        >
          <Button fullSize>
            {locales.route.root.loginOrRegisterCTA.register}
          </Button>
        </Link>
      </div>
    </div>
  );
}
