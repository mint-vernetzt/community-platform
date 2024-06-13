import Chip from "../Chip/Chip";
import HeaderLogo from "../HeaderLogo/HeaderLogo";

export interface ProfilePageProps {}

function ProfilePage(props: ProfilePageProps) {
  return (
    <>
      <header className="shadow-md mb-8">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] relative z-10">
          <div className="px-4 pt-3 pb-3 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-primary w-10 h-10">
                  AS
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <a>Profil bearbeiten</a>
                  </li>
                  <li>
                    <a>Profil löschen</a>
                  </li>
                  <li>
                    <a>Ausloggen</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="hidden @md:mv-block mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] mt-8 @md:mv-mt-10 @lg:mv-mt-20">
        <div className="hero hero-news flex items-end rounded-3xl relative overflow-hidden bg-yellow-500 h-60 @lg:mv-h-120">
          <div className="absolute bottom-6 right-6">
            <button className="btn btn-primary">Hintergrund ändern</button>
          </div>
        </div>
      </section>

      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] relative pb-44">
        <div className="flex flex-col @md:mv-flex-row -mx-4">
          <div className="@md:mv-flex-1/2 @lg:mv-flex-5/12 px-4 pt-10 @lg:mv-pt-0">
            <div className="px-4 py-8 @lg:mv-p-8 pb-15 @md:mv-pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative @lg:mv-ml-14 @lg:-mv-mt-64">
              <div className="flex items-center flex-col">
                <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center rounded-md">
                  AS
                </div>
                <h3 className="mt-6 text-5xl mb-1">Anna Schöter</h3>
                <p className="font-bold text-sm">
                  Community-Management MINTvernetzt
                </p>
              </div>

              <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>
              <div className="">
                <p className="text-mb mb-2">
                  <a
                    href="mailto:anna.schroeter@mint-vernetzt.de"
                    className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                  >
                    <span className="icon w-6 mr-4">
                      <svg
                        width="24"
                        height="19"
                        viewBox="0 0 24 19"
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                      </svg>
                    </span>
                    <span>anna.schroeter@mint-vernetzt.de</span>
                  </a>
                </p>
                <p className="text-md text-neutral-600 mb-2">
                  <a
                    href="tel:492117570762"
                    className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                  >
                    <span className="icon w-6 mr-4">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M5.134 1.993a.915.915 0 0 0-1.37-.085L2.367 3.305c-.653.654-.893 1.578-.608 2.39a23.717 23.717 0 0 0 5.627 8.92 23.717 23.717 0 0 0 8.92 5.627c.812.285 1.736.045 2.39-.608l1.396-1.395a.916.916 0 0 0-.086-1.37l-3.114-2.422a.916.916 0 0 0-.783-.165l-2.956.738a2.356 2.356 0 0 1-2.237-.62L7.6 11.085a2.355 2.355 0 0 1-.62-2.237l.74-2.956a.915.915 0 0 0-.166-.783L5.134 1.993ZM2.744.89a2.356 2.356 0 0 1 3.526.22l2.422 3.113c.444.571.6 1.315.425 2.017L8.38 9.197a.915.915 0 0 0 .24.868l3.317 3.317a.915.915 0 0 0 .87.24l2.954-.739a2.354 2.354 0 0 1 2.017.426l3.113 2.421a2.355 2.355 0 0 1 .22 3.525l-1.395 1.396c-1 .999-2.493 1.438-3.884.948a25.156 25.156 0 0 1-9.464-5.967A25.156 25.156 0 0 1 .401 6.17c-.49-1.39-.05-2.885.949-3.884L2.745.89Z" />
                      </svg>
                    </span>
                    <span>+49 211 7570762</span>
                  </a>
                </p>

                <ul className="list-none flex flex-wrap -mx-1">
                  <li className="flex-auto px-1">
                    <a
                      href="#"
                      className="flex items-center justify-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M.4 10a9.6 9.6 0 1 1 19.2 0A9.6 9.6 0 0 1 .4 10Zm9-8.308c-.804.245-1.602.984-2.264 2.226a9.164 9.164 0 0 0-.474 1.047 15.23 15.23 0 0 0 2.738.344V1.692ZM5.499 4.647c.17-.461.365-.893.577-1.294a8.04 8.04 0 0 1 .716-1.12 8.412 8.412 0 0 0-2.73 1.827c.433.22.915.419 1.437.588v-.001ZM4.61 9.4c.043-1.284.225-2.504.523-3.61a10.949 10.949 0 0 1-1.878-.8A8.357 8.357 0 0 0 1.622 9.4H4.61Zm1.68-3.29a14.813 14.813 0 0 0-.48 3.29H9.4V6.51a16.21 16.21 0 0 1-3.11-.4Zm4.309.398V9.4h3.588a14.813 14.813 0 0 0-.479-3.29c-.97.225-2.017.362-3.11.4v-.002ZM5.812 10.6c.042 1.184.211 2.297.479 3.29a16.338 16.338 0 0 1 3.109-.398V10.6H5.812Zm4.788 0v2.89a16.21 16.21 0 0 1 3.11.4c.267-.993.436-2.106.48-3.29H10.6Zm-3.938 4.435c.144.375.302.725.474 1.047.662 1.242 1.461 1.98 2.264 2.226v-3.616a15.23 15.23 0 0 0-2.739.344Zm.131 2.731a8.034 8.034 0 0 1-.717-1.12c-.221-.417-.414-.85-.577-1.294-.494.159-.975.355-1.438.588a8.411 8.411 0 0 0 2.731 1.826h.002Zm-1.66-3.556a16.031 16.031 0 0 1-.524-3.61H1.622a8.356 8.356 0 0 0 1.634 4.41 10.9 10.9 0 0 1 1.878-.8Zm8.074 3.556a8.41 8.41 0 0 0 2.73-1.825c-.462-.232-.943-.43-1.436-.588-.163.444-.356.876-.577 1.294a8.022 8.022 0 0 1-.716 1.12ZM10.6 14.691v3.617c.804-.245 1.602-.984 2.264-2.226.172-.322.331-.672.474-1.047-.9-.197-1.817-.312-2.738-.343v-.001Zm4.266-.481a10.9 10.9 0 0 1 1.878.8 8.355 8.355 0 0 0 1.634-4.41H15.39a16.027 16.027 0 0 1-.524 3.61Zm3.512-4.81a8.356 8.356 0 0 0-1.634-4.41 10.9 10.9 0 0 1-1.878.8 16.08 16.08 0 0 1 .524 3.61h2.988Zm-4.454-6.047c.212.401.407.833.578 1.294.493-.159.973-.355 1.435-.588a8.412 8.412 0 0 0-2.73-1.824c.262.34.502.716.717 1.118Zm-.586 1.612a9.308 9.308 0 0 0-.474-1.047c-.662-1.242-1.46-1.98-2.264-2.226v3.616a15.23 15.23 0 0 0 2.738-.344Z" />
                      </svg>
                    </a>
                  </li>
                  <li className="flex-auto px-1">
                    <a
                      href="#"
                      className="flex items-center justify-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M.4 1.775C.4 1.015 1.03.4 1.81.4h16.38c.779 0 1.41.616 1.41 1.375v16.45c0 .76-.631 1.375-1.41 1.375H1.81C1.03 19.6.4 18.984.4 18.225V1.775ZM6.33 16.473v-8.67h-2.88v8.67h2.88Zm-1.44-9.855c1.005 0 1.63-.664 1.63-1.497-.018-.851-.624-1.498-1.61-1.498-.987 0-1.631.648-1.631 1.498 0 .833.625 1.497 1.592 1.497h.02Zm5.89 9.855V11.63c0-.26.02-.519.096-.703.208-.518.682-1.054 1.478-1.054 1.043 0 1.46.794 1.46 1.96v4.639h2.88V11.5c0-2.664-1.42-3.902-3.316-3.902-1.529 0-2.214.84-2.598 1.431v.03h-.02l.02-.03V7.803h-2.88c.036.813 0 8.67 0 8.67h2.88Z" />
                      </svg>
                    </a>
                  </li>
                </ul>

                <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

                <p className="text-xs mb-4 text-center">
                  Profil besteht seit 30. Dezember 2022
                </p>
              </div>
            </div>
          </div>

          <div className="@md:mv-flex-1/2 @lg:mv-flex-7/12 px-4 pt-10 @lg:mv-pt-20">
            <div className="flex flex-col-reverse @lg:mv-flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">Hi, ich bin Anna</h1>
              </div>

              <div className="flex-initial @lg:mv-pl-4 pt-3 mb-6">
                <button className="btn btn-outline btn-primary">
                  Profil bearbeiten
                </button>
              </div>
            </div>

            <p className="mb-6">
              MINTvernetzt ist die Service- und Anlaufstelle für die Community
              der MINT-Akteur:innen in Deutschland. Als Community-Managerin
              freue ich mich über Eure Ideen, Impulse und Inspirationen, um die
              MINT-Bildung in Deutschland gemeinsam zu stärken.
            </p>

            <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
              <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                Aktivitätsgebiete
              </div>
              <div className="@lg:mv-flex-auto">Düsseldorf / Bundesweit</div>
            </div>

            <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
              <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                Kompetenzen
              </div>
              <div className="flex-auto">
                Community Management / Projektleitung
              </div>
            </div>

            <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
              <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                Interessen
              </div>
              <div className="flex-auto">
                Community-Plattformen / Plattformentwicklung / Netzwerkauf- und
                ausbau
              </div>
            </div>

            <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
              <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                Ich biete
              </div>
              <div className="flex-auto">
                <Chip title="Vernetzung" slug="" isEnabled />
                <Chip title="Community-Management" slug="" isEnabled />
                <Chip title="Gute Praxis" slug="" isEnabled />
                <Chip title="Kommunikation" slug="" isEnabled />
                <Chip title="Projektmanagement" slug="" isEnabled />
              </div>
            </div>

            <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
              <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                Ich suche
              </div>
              <div className="flex-auto">
                <Chip title="Vernetzung" slug="" isEnabled />
              </div>
            </div>

            <div className="flex flex-row flex-nowrap mb-6 mt-14 items-center">
              <div className="flex-auto pr-4">
                <h3 className="mb-0 font-bold">Assoziert mit</h3>
              </div>

              <div className="flex-initial pl-4">
                <button className="btn btn-outline btn-primary">
                  Organisation anlegen
                </button>
              </div>
            </div>

            <div className="flex mb-6 text-sm flex-wrap -m-3 flex-col @lg:mv-flex-row">
              <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">Zukunft durch Innovation</p>
                    <p>
                      gemeinnützige Organisation, Verein, gemeinnützige
                      Organisation, Verein
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
