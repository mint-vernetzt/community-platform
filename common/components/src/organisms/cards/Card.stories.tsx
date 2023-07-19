import Button from "../../molecules/Button";
import EventCard from "./EventCard";
import OrganizationCard from "./OrganizationCard";
import ProfileCard from "./ProfileCard";

export function Profile() {
  return (
    <div className="mv-flex mv-gap-[39px]">
      <div className="mv-w-[253px]">
        <ProfileCard
          match={98}
          profile={{
            academicTitle: "Prof. Dr.",
            username: "julialanglangschmittberger",
            avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
            background: "./bla_giesserstrasse_12a-1512x1080.jpg",
            firstName: "Julia",
            lastName: "Langlang-Schmittberger",
            position: "Projektleiterin MINTvernetzt",
            memberOf: [
              {
                name: "MINTvernetzt",
                slug: "mintvernetzt",
                logo: "./mintvernetzt-logo.png",
              },
              {
                name: "matrix ggmbh",
                slug: "matrixggmbh",
                logo: "./matrixggmbh-logo.png",
              },
              {
                name: "MINT-Campus",
                slug: "mintcampus-len1g1op",
              },
              {
                name: "matrix GmbH & Co. KG",
                slug: "matrixgmbhcokg",
              },
            ],
            areas: ["Hamburg", "Bundesweit"],
            offers: [
              "Wirkungsorientierung/Qualitätsentwicklung",
              "SEO",
              "Suchmaschinenoptimierung",
            ],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <ProfileCard
          publicAccess={true}
          profile={{
            academicTitle: "Prof. Dr.",
            username: "julialanglangschmittberger",
            avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
            background: "./bla_giesserstrasse_12a-1512x1080.jpg",
            firstName: "Julia",
            lastName: "Langlang-Schmittberger",
            position: "Projektleiterin MINTvernetzt",
            memberOf: [
              {
                name: "MINTvernetzt",
                slug: "mintvernetzt",
                logo: "./mintvernetzt-logo.png",
              },
              {
                name: "matrix ggmbh",
                slug: "matrixggmbh",
                logo: "./matrixggmbh-logo.png",
              },
              {
                name: "MINT-Campus",
                slug: "mintcampus-len1g1op",
              },
              {
                name: "matrix GmbH & Co. KG",
                slug: "matrixgmbhcokg",
              },
            ],
            areas: [],
            offers: [],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <ProfileCard
          profile={{
            academicTitle: "Prof. Dr.",
            username: "julialanglangschmittberger",
            firstName: "Julia",
            lastName: "Langlang-Schmittberger",
            position: "Projektleiterin MINTvernetzt",
            memberOf: [],
            areas: [],
            offers: [],
          }}
        />
      </div>
    </div>
  );
}
Profile.storyName = "profile";

export function Organization() {
  return (
    <div className="mv-flex mv-gap-[39px]">
      <div className="mv-w-[253px]">
        <OrganizationCard
          organization={{
            name: "Hochschule Fulda / Projekt MINTmachClub Fulda",
            slug: "hochschulefulda",
            logo: "./hochschulefulda-logo.jpeg",
            background: "./hochschule-fulda.jpg",
            areas: ["Hessen"],
            types: ["Bildungseinrichtung"],
            focuses: ["Berufsorientierung", "Ländlicher Raum"],
            teamMembers: [
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
                avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
                avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
                avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
                avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
              },
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
              },
            ],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <OrganizationCard
          publicAccess={true}
          organization={{
            name: "Hochschule Fulda / Projekt MINTmachClub Fulda",
            slug: "hochschulefulda",
            logo: "./hochschulefulda-logo.jpeg",
            background: "./hochschule-fulda.jpg",
            areas: [],
            types: ["Bildungseinrichtung"],
            focuses: [],
            teamMembers: [
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
                avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
                avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
                avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
                avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
              },
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
              },
            ],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <OrganizationCard
          organization={{
            name: "Hochschule Fulda / Projekt MINTmachClub Fulda",
            slug: "hochschulefulda",
            areas: [],
            types: ["Bildungseinrichtung"],
            focuses: [],
            teamMembers: [],
          }}
        />
      </div>
    </div>
  );
}
Organization.storyName = "organization";

export function Event() {
  const now = new Date();
  const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
  const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);

  return (
    <div className="mv-flex mv-gap-[39px]">
      {/* draft */}
      <div className="mv-w-[253px]">
        <EventCard
          event={{
            name: "-",
            slug: "-",
            startTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 10,
              8,
              0,
              0
            ),
            endTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 10,
              12,
              0,
              0
            ),
            published: false,
            canceled: false,
            stage: {
              slug: "on-site",
              title: "Vor Ort",
            },
            responsibleOrganizations: [
              {
                name: "MINTvernetzt",
                slug: "mintvernetzt",
                logo: "./mintvernetzt-logo.png",
              },
              {
                name: "matrix ggmbh",
                slug: "matrixggmbh",
                logo: "./matrixggmbh-logo.png",
              },
              {
                name: "MINT-Campus",
                slug: "mintcampus-len1g1op",
              },
              {
                name: "matrix GmbH & Co. KG",
                slug: "matrixgmbhcokg",
              },
            ],
            _count: {
              childEvents: 0,
              participants: 100,
              waitingList: 0,
            },
            isTeamMember: true,
          }}
        />
      </div>
      {/* published */}
      <div className="mv-w-[253px]">
        <EventCard
          event={{
            name: "-",
            slug: "-",
            startTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 10,
              8,
              0,
              0
            ),
            endTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 10,
              12,
              0,
              0
            ),
            published: true,
            canceled: false,
            stage: {
              slug: "on-site",
              title: "Vor Ort",
            },
            responsibleOrganizations: [
              {
                name: "MINTvernetzt",
                slug: "mintvernetzt",
                logo: "./mintvernetzt-logo.png",
              },
              {
                name: "matrix ggmbh",
                slug: "matrixggmbh",
                logo: "./matrixggmbh-logo.png",
              },
              {
                name: "MINT-Campus",
                slug: "mintcampus-len1g1op",
              },
              {
                name: "matrix GmbH & Co. KG",
                slug: "matrixgmbhcokg",
              },
            ],
            _count: {
              childEvents: 0,
              participants: 100,
              waitingList: 0,
            },
            isTeamMember: true,
          }}
        />
      </div>
      {/* canceled */}
      <div className="mv-w-[253px]">
        <EventCard
          event={{
            name: "Workshop: Klassismuskritisch handeln",
            slug: "workshopklassismuskritischhandeln",
            background: "./bla_giesserstrasse_12a-1512x1080.jpg",
            subline:
              "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen innerhalb der Bildung",
            startTime: new Date(now.getFullYear() + 10, 0, 1, 10, 0, 0),
            endTime: new Date(now.getFullYear() + 10, 0, 1, 16, 0, 0),
            published: true,
            canceled: true,
            stage: {
              slug: "on-site",
              title: "Vor Ort",
            },
            responsibleOrganizations: [
              {
                name: "MINTvernetzt",
                slug: "mintvernetzt",
                logo: "./mintvernetzt-logo.png",
              },
              {
                name: "matrix ggmbh",
                slug: "matrixggmbh",
                logo: "./matrixggmbh-logo.png",
              },
              {
                name: "MINT-Campus",
                slug: "mintcampus-len1g1op",
              },
              {
                name: "matrix GmbH & Co. KG",
                slug: "matrixgmbhcokg",
              },
            ],
            _count: {
              childEvents: 0,
              participants: 100,
              waitingList: 0,
            },
          }}
        />
      </div>
      {/* past event */}
      <div className="mv-w-[253px]">
        <EventCard
          event={{
            name: "Workshop: Klassismuskritisch handeln",
            slug: "workshopklassismuskritischhandeln",
            background: "./bla_giesserstrasse_12a-1512x1080.jpg",
            startTime: new Date(now.getFullYear() - 3, 0, 1, 12, 0, 0),
            endTime: new Date(now.getFullYear() - 3, 0, 1, 18, 0, 0),
            stage: {
              slug: "hybrid",
              title: "Hybrid",
            },
            responsibleOrganizations: [],
            _count: {
              childEvents: 0,
            },
          }}
        />
      </div>
      {/* <div className="mv-w-[253px]">
        <OrganizationCard
          publicAccess={true}
          organization={{
            name: "Hochschule Fulda / Projekt MINTmachClub Fulda",
            slug: "hochschulefulda",
            logo: "./hochschulefulda-logo.jpeg",
            background: "./hochschule-fulda.jpg",
            areas: [],
            types: ["Bildungseinrichtung"],
            focuses: [],
            teamMembers: [
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
                avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
                avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
                avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
                avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
              },
              {
                firstName: "Maria",
                lastName: "Lupan",
                username: "marialupan",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                username: "jonaskakaroto",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                username: "toaheftiba",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                username: "behrouzsasani",
              },
            ],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <OrganizationCard
          organization={{
            name: "Hochschule Fulda / Projekt MINTmachClub Fulda",
            slug: "hochschulefulda",
            areas: [],
            types: ["Bildungseinrichtung"],
            focuses: [],
            teamMembers: [],
          }}
        />
      </div> */}
    </div>
  );
}
Event.storyName = "event";

export default {
  title: "Organism/Cards",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
