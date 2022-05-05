import Chip from "../Chip/Chip";
import HeaderLogo from "../HeaderLogo/HeaderLogo";
import { H1, H3 } from "../Heading/Heading";
import Icon, { IconType } from "../Icon/Icon";

export interface ExploreProfilesProps {}

function ExploreProfiles(props: ExploreProfilesProps) {
  return (
    <div>
      <header className="shadow-md mb-8">
        <div className="md:container md:mx-auto relative z-10">
          <div className="px-4 pt-3 pb-3 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                <label tabIndex="0" className="btn btn-primary w-10 h-10">
                  AS
                </label>
                <ul
                  tabIndex="0"
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

      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Explore the Community</H1>
        <p className="">
          Wir entwickeln MINTvernetzt mit Euch (weiter)! Hier könnt Ihr Euch
          vernetzen, gute Praxis teilen und Kooperationen aufbauen. So machen
          wir zusammen MINT-Bildungsangebote in Deutschland sichtbar, helfen
          Euch bei der Weiterentwicklung und schaffen Innovationsräume.
        </p>
      </section>

      <section
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          data-testid="grid"
          className="flex flex-wrap justify-center -md:mx-4 items-stretch"
        >
          {[
            {
              name: `Anna Schröter`,
              position: `Community-Management MINTvernetzt`,
              text: `MINTvernetzt ist die Service- und Anlaufstelle für die Community der MINT-Akteur:innen ...`,
              areas: `Düsseldorf / Bundesweit`,
            },
            {
              name: `Anna Schröter`,
              position: `Community-Management MINTvernetzt`,
              text: `MINTvernetzt ist die Service- und Anlaufstelle für die Community der MINT-Akteur:innen ...`,
              areas: `Düsseldorf / Bundesweit`,
            },
            {
              name: `Anna Schröter`,
              position: `Community-Management MINTvernetzt`,
              text: `MINTvernetzt ist die Service- und Anlaufstelle für die Community der MINT-Akteur:innen ...`,
              areas: `Düsseldorf / Bundesweit`,
            },
            {
              name: `Anna Schröter`,
              position: `Community-Management MINTvernetzt`,
              text: `MINTvernetzt ist die Service- und Anlaufstelle für die Community der MINT-Akteur:innen ...`,
              areas: `Düsseldorf / Bundesweit`,
            },
            {
              name: `Anna Schröter`,
              position: `Community-Management MINTvernetzt`,
              text: `MINTvernetzt ist die Service- und Anlaufstelle für die Community der MINT-Akteur:innen ...`,
              areas: `Düsseldorf / Bundesweit`,
            },
          ].map((profile, index) => (
            <div
              key={`profile-${index}`}
              data-testid="gridcell"
              className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
            >
              <a
                href="#"
                className="flex flex-wrap content-between items-stretch px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
              >
                <div className="flex items-center flex-row mb-4">
                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md">
                    AS
                  </div>
                  <div className="pl-4">
                    <H3 like="h4" className="text-xl mb-1">
                      {profile.name}
                    </H3>
                    <p className="font-bold text-sm">{profile.position}</p>
                  </div>
                </div>

                <p className="mb-3">{profile.text}</p>

                <div className="flex font-semibold flex-col lg:flex-row w-full">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Aktivitätsgebiete
                  </div>
                  <div className="flex-auto">
                    <span>{profile.areas}</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ExploreProfiles;
