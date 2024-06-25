import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";

const i18nNS = ["routes/profile/settings"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const username = getParamValueOrThrow(params, "username");
  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  if (sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    // TODO: Could this be moved to root.tsx?
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(
        `/accept-terms?redirect_to=/profile/${username}/settings`
      );
    }
  }
  return null;
};

function Index() {
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;

  const { t } = useTranslation(i18nNS);

  return (
    <>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] relative">
        <div className="flex flex-col @lg:mv-flex-row -mx-4 pt-10 @lg:mv-pt-0">
          <div className="basis-4/12 px-4">
            <div className="px-4 py-8 @lg:mv-p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
              <h3 className="font-bold mb-7">{t("context.headline")}</h3>
              <menu>
                <ul>
                  <li>
                    <NavLink
                      to="general"
                      className={({ isActive }) => getClassName(isActive)}
                      preventScrollReset
                    >
                      {t("context.general")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="notifications"
                      className={({ isActive }) => getClassName(isActive)}
                      preventScrollReset
                    >
                      {t("context.notifications")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="security"
                      className={({ isActive }) => getClassName(isActive)}
                      preventScrollReset
                    >
                      {t("context.security")}
                    </NavLink>
                  </li>
                </ul>
                <hr className="border-neutral-400 my-4 @lg:mv-my-8" />
                <div>
                  <NavLink
                    to="delete"
                    className={({ isActive }) => getClassName(isActive)}
                    preventScrollReset
                  >
                    {t("context.delete")}
                  </NavLink>
                </div>
              </menu>
            </div>
            <div className="px-8 relative mb-16">
              <p className="text-xs flex items-center mb-4">
                <span className="icon w-4 h-4 mr-3">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{t("state.public")}</span>
              </p>

              <p className="text-xs flex items-center mb-4">
                <span className="icon w-5 h-5 mr-2">
                  <svg
                    className="block w-4 h-5 "
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6987 14.0475C18.825 12.15 20 10 20 10C20 10 16.25 3.125 10 3.125C8.79949 3.12913 7.61256 3.37928 6.5125 3.86L7.475 4.82375C8.28429 4.52894 9.13868 4.3771 10 4.375C12.65 4.375 14.8487 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.08141 18.535 10C18.4625 10.1088 18.3825 10.2288 18.2912 10.36C17.8725 10.96 17.2537 11.76 16.46 12.5538C16.2537 12.76 16.0387 12.9638 15.8137 13.1613L16.6987 14.0475Z"
                      fill="#454C5C"
                    />
                    <path
                      d="M14.1212 11.47C14.4002 10.6898 14.4518 9.84643 14.2702 9.03803C14.0886 8.22962 13.6811 7.48941 13.0952 6.90352C12.5093 6.31764 11.7691 5.91018 10.9607 5.72854C10.1523 5.5469 9.30895 5.59856 8.52875 5.8775L9.5575 6.90625C10.0379 6.83749 10.5277 6.88156 10.9881 7.03495C11.4485 7.18835 11.8668 7.44687 12.21 7.79001C12.5531 8.13316 12.8116 8.55151 12.965 9.01191C13.1184 9.47231 13.1625 9.96211 13.0937 10.4425L14.1212 11.47ZM10.4425 13.0937L11.47 14.1212C10.6898 14.4002 9.84643 14.4518 9.03803 14.2702C8.22962 14.0886 7.48941 13.6811 6.90352 13.0952C6.31764 12.5093 5.91018 11.7691 5.72854 10.9607C5.5469 10.1523 5.59856 9.30895 5.8775 8.52875L6.90625 9.5575C6.83749 10.0379 6.88156 10.5277 7.03495 10.9881C7.18835 11.4485 7.44687 11.8668 7.79001 12.21C8.13316 12.5531 8.55151 12.8116 9.01191 12.965C9.47231 13.1184 9.96211 13.1625 10.4425 13.0937Z"
                      fill="#454C5C"
                    />
                    <path
                      d="M4.1875 6.8375C3.9625 7.0375 3.74625 7.24 3.54 7.44625C2.76456 8.22586 2.0694 9.08141 1.465 10L1.70875 10.36C2.1275 10.96 2.74625 11.76 3.54 12.5538C5.15125 14.165 7.35125 15.625 10 15.625C10.895 15.625 11.7375 15.4588 12.525 15.175L13.4875 16.14C12.3874 16.6207 11.2005 16.8708 10 16.875C3.75 16.875 0 10 0 10C0 10 1.17375 7.84875 3.30125 5.9525L4.18625 6.83875L4.1875 6.8375ZM17.0575 17.9425L2.0575 2.9425L2.9425 2.0575L17.9425 17.0575L17.0575 17.9425Z"
                      fill="#454C5C"
                    />
                  </svg>
                </span>
                <span>{t("state.registered")}</span>
              </p>
            </div>
          </div>
          <div className="basis-6/12 px-4 pb-24">
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;
