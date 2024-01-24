import { Button } from "@mint-vernetzt/components";
import React from "react";

export type RoadmapColumnProps = {
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const countRoadmapCards = React.Children.count(props.children);
  return (
    <div>
      <h4 className="mv-text-center mv-mb-4 mv-text-2xl mv-text-primary mv-font-bold">
        {props.title}
      </h4>
      <div className="mv-bg-blue-50 mv-rounded-2xl mv-p-4 xl:mv-p-6 mv-flex mv-flex-col mv-group">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="mv-peer mv-order-2 mv-h-0 mv-w-0 mv-opacity-0"
        />
        <div
          className={`mv-bg-blue-50 mv-rounded-2xl mv-grid mv-overflow-hidden mv-transition-all mv-grid-rows-[repeat(2,_1fr)_repeat(${countRoadmapCards},_0fr)] md:mv-grid-rows-[repeat(3,_1fr)_repeat(${countRoadmapCards},_0fr)] peer-checked:mv-grid-rows-${countRoadmapCards} mv-order-1`}
        >
          {props.children}
        </div>
        {countRoadmapCards > 3 ? (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="mv-order-3 mv-mt-4 lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group"
          >
            <span className="show-more mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              Mehr anzeigen
            </span>
            <span className="show-less mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              Weniger anzeigen
            </span>
          </label>
        ) : countRoadmapCards > 2 ? (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="mv-order-3 mv-mt-4 lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group md:mv-hidden mv-underline mv-decoration-inherit mv-decoration-auto"
            >
              <span className="show-more mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                Mehr anzeigen
              </span>
              <span className="show-less mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                Weniger anzeigen
              </span>
            </label>
            <div className="mv-hidden md:mv-block mv-mt-4 lg:mv-mt-6 mv-h-5 mv-order-3"></div>
          </>
        ) : (
          <div className="mv-hidden md:mv-block mv-mt-4 lg:mv-mt-6 mv-h-5 mv-order-3"></div>
        )}
      </div>
    </div>
  );
}

export type RoadmapCardProps = {
  title: string;
  text: string;
};

function RoadmapCard(props: RoadmapCardProps) {
  return (
    <div className="mv-card mv-bg-white mv-rounded-lg mv-text-primary mv-w-full mv-px-4 xl:mv-px-6">
      <h5 className="mv-font-bold mv-text-lg mv-mb-3">{props.title}</h5>
      <p>{props.text}</p>
    </div>
  );
}

function Roadmap() {
  return (
    <section
      id="roadmap"
      className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)] mv-py-16 lg:mv-py-24"
    >
      <div className="mv-container">
        <div className="mv-grid mv-grid-cols-1 md:mv-grid-cols-2 xl:mv-grid-cols-3 mv-gap-y-8 md:mv-gap-y-12 md:mv-gap-x-4 xl:mv-gap-x-4">
          <RoadmapColumn title="Ideen" id="1">
            <RoadmapCard
              title="Vernetzungs-Funktion"
              text="Per Vernetzungsfunktion kannst Du Dich mit anderen Akteur:innen oder Organisationen vernetzen und Deine Kontakte in Listen zusammenstellen."
            />
            <RoadmapCard
              title="Matching-Funktion"
              text="Per Vernetzungsfunktion kannst Du Dich mit anderen Akteur:innen oder Organisationen vernetzen und Deine Kontakte in Listen zusammenstellen."
            />
            <RoadmapCard
              title="Interaktion"
              text="Über Interaktionen (wie liken oder kommentieren) kannst Du auf bestehende Inhalte wie z.B. Projekte oder Beiträge reagieren."
            />
            <RoadmapCard
              title="Eigene Events anlegen"
              text="Du kannst als MINT-Akteur:in eigene Events anlegen und die Teilnehmenden verwalten."
            />
            <RoadmapCard
              title="Sich selbst zu Organisationen hinzufügen"
              text="Du kannst Dich selbst einer Organisation hinzufügen und musst Dich nicht mehr von einem Teammitglied hinzufügen lassen."
            />
            <RoadmapCard
              title="MINT-Campus Anbindung"
              text="Sieh wer Kurse erstellt, welche Kurse von anderen belegt werden und zeige, welche Kurse Du absolviert hast."
            />
          </RoadmapColumn>

          <RoadmapColumn title="In der Entwicklung" id="2">
            <RoadmapCard
              title="Filter-Funktion"
              text="Mit dem Filter kannst Du innerhalb der Übersichtseiten der Profile, Organisa-tionen, Events oder Projekte nach bestimmten Kriterien durchsuchen."
            />
            <RoadmapCard
              title="Spracheinstellung: Englisch"
              text="Mit der erweiterten Spracheinstellung ermöglichen wir einem größeren Akteur:innen-Kreis die Community Plattform gut zu nutzen."
            />
            <RoadmapCard
              title="Dashboard"
              text="Über das Dashboard siehst du nach dem Einloggen übersichtlich alle Funktionen der Plattform auf einen Blick und wirst über Neuigkeiten informiert."
            />
          </RoadmapColumn>

          <RoadmapColumn title="Bereits umgesetzt" id="3">
            <RoadmapCard
              title="Profil & Organisationsprofil"
              text="Du stellst Dich mithilfe Deines Profils der MINT-Community vor und legst Deine Organisation mit Teammitgliedern an."
            />
            <RoadmapCard
              title="Eventmanagement"
              text="Stöbere nach passenden MINTvernetzt-Events, melde Dich an und schau, wer sich auch für das Event angemeldet hat."
            />
            <RoadmapCard
              title="Suche"
              text="Über die Suchfunktion kannst Du nach Profilen, Organisationen, Events, Projek-ten und nach Stichwörtern suchen."
            />
            <RoadmapCard
              title="MINT-ID"
              text="Um bequem zwischen den beiden Ange-boten MINTvernetzt und MINT-Campus wechseln zu können, gibt es die MINT-ID, mit der man beide Plattformen nutzen kann (Single-Sign-in)."
            />
            <RoadmapCard
              title="Startseite"
              text="Die Startseite informiert neue Mitglieder über Inhalte und Nutzungszahlen der Community-Plattform."
            />
          </RoadmapColumn>
        </div>
        <div className="mv-flex mv-justify-center mv-mt-12">
          <a
            className="mv-btn mv-border-2 mv-bg-white mv-border-primary mv-text-primary mv-text-base mv-font-semibold hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
            href="mailto:community@mint-vernetzt.de"
          >
            Ideen einreichen
          </a>
        </div>
      </div>
    </section>
  );
}

export default Roadmap;
