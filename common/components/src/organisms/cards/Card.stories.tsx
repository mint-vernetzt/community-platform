import { languageModuleMap } from "~/locales/.server";
import { Button } from "../../molecules/Button";
import { EventCard } from "./EventCard";
import { OrganizationCard } from "./OrganizationCard";
import { ProfileCard } from "./ProfileCard";
import { ProjectCard } from "./ProjectCard";

export function Profile() {
  return (
    <div className="mv-flex mv-gap-[39px]">
      <div className="mv-w-[253px]">
        <ProfileCard
          match={98}
          locales={languageModuleMap.en["explore/profiles"]}
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
          locales={languageModuleMap.en["explore/profiles"]}
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
          locales={languageModuleMap.en["explore/profiles"]}
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

type EventStoryProps = {
  publicAccess: true;
  isTeamMember: false;
  isSpeaker: false;
  isParticipant: false;
  isOnWaitingList: false;
};

export function EventStory(props: EventStoryProps) {
  const { publicAccess, ...otherProps } = props;
  const now = new Date();

  if (publicAccess) {
    otherProps.isOnWaitingList = false;
    otherProps.isParticipant = false;
    otherProps.isTeamMember = false;
    otherProps.isSpeaker = false;
  }
  return (
    <>
      <div className="mv-flex mv-gap-8 mv-flex-wrap">
        <div className="mv-w-[267px]">
          {!publicAccess && (props.isSpeaker || props.isTeamMember) && (
            <EventCard
              publicAccess={publicAccess}
              participateControl={
                <Button type="submit" size="x-small">
                  Anmelden
                </Button>
              }
              waitingListControl={<Button size="x-small">Warteliste</Button>}
              event={{
                name: "-",
                slug: "-",
                startTime: new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate() + 10,
                  11,
                  0,
                  0
                ),
                endTime: new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate() + 10,
                  11,
                  0,
                  0
                ),
                participationUntil: new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate() + 10,
                  11,
                  0,
                  0
                ),
                published: false,
                canceled: false,
                responsibleOrganizations: [],
                _count: {
                  childEvents: 0,
                  participants: 100,
                  waitingList: 0,
                },
                ...otherProps,
              }}
            />
          )}
        </div>

        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
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
              participationUntil: new Date(
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
              },
              responsibleOrganizations: [
                {
                  name: "MINTvernetzt",
                  slug: "mintvernetzt",
                  logo: "./mintvernetzt-logo.png",
                },
              ],
              _count: {
                childEvents: 0,
                participants: 100,
                waitingList: 0,
              },
              ...otherProps,
            }}
          />
        </div>
        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
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
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 10,
                8,
                0,
                0
              ),
              published: true,
              canceled: false,
              stage: {
                slug: "online",
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
              ],
              _count: {
                childEvents: 0,
                participants: 100,
                waitingList: 0,
              },
              ...otherProps,
            }}
          />
        </div>
        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={true}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
              background: "./bla_giesserstrasse_12a-1512x1080.jpg",
              subline:
                "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen in der Bildung",
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
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 10,
                8,
                0,
                0
              ),
              published: true,
              canceled: false,
              stage: {
                slug: "hybrid",
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
              ],
              _count: {
                childEvents: 100,
                participants: 100,
                waitingList: 0,
              },
              ...otherProps,
            }}
          />
        </div>

        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
              background: "./bla_giesserstrasse_12a-1512x1080.jpg",
              subline:
                "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen in der Bildung",

              startTime: new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                12,
                11,
                0,
                0
              ),
              endTime: new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                13,
                12,
                0,
                0
              ),
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                12,
                11,
                0,
                0
              ),
              published: true,
              canceled: false,
              participantLimit: 100,
              stage: {
                slug: "hybrid",
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
                participants: 0,
                waitingList: 0,
              },
              ...otherProps,
            }}
          />
        </div>
        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
              background: "./bla_giesserstrasse_12a-1512x1080.jpg",
              subline:
                "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen in der Bildung",

              startTime: new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                29,
                8,
                0,
                0
              ),
              endTime: new Date(
                now.getFullYear(),
                now.getMonth() + 2,
                1,
                12,
                0,
                0
              ),
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                29,
                8,
                0,
                0
              ),
              published: true,
              canceled: false,
              participantLimit: 100,
              stage: {
                slug: "hybrid",
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
              ...otherProps,
            }}
          />
        </div>
        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
              background: "./bla_giesserstrasse_12a-1512x1080.jpg",
              subline:
                "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen in der Bildung",

              startTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                8,
                0,
                0
              ),
              endTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                12,
                0,
                0
              ),
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                8,
                0,
                0
              ),
              published: true,
              canceled: false,
              participantLimit: 0,
              stage: {
                slug: "hybrid",
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
                participants: 0,
                waitingList: 10,
              },
              ...otherProps,
            }}
          />
        </div>
        <div className="mv-w-[267px]">
          <EventCard
            publicAccess={publicAccess}
            participateControl={
              <Button type="submit" size="x-small">
                Anmelden
              </Button>
            }
            waitingListControl={<Button size="x-small">Warteliste</Button>}
            event={{
              name: "Workshop: Klassismuskritisch handeln",
              slug: "workshopklassismuskritischhandeln",
              background: "./bla_giesserstrasse_12a-1512x1080.jpg",
              subline:
                "Chancenarm statt bildungsfern - von sozialer Herkunft und Stereotypen in der Bildung",

              startTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                8,
                0,
                0
              ),
              endTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                12,
                0,
                0
              ),
              participationUntil: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 10,
                12,
                0,
                0
              ),
              published: true,
              canceled: true,
              participantLimit: 0,
              stage: {
                slug: "hybrid",
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
                participants: 0,
                waitingList: 10,
              },
              ...otherProps,
            }}
          />
        </div>
      </div>
    </>
  );
}
EventStory.storyName = "event";
EventStory.args = {
  publicAccess: true,
  isTeamMember: false,
  isSpeaker: false,
  isParticipant: false,
  isOnWaitingList: false,
};
EventStory.parameters = {
  controls: { disable: false },
};

export function ProjectStory() {
  return (
    <div className="mv-flex mv-gap-[39px]">
      <div className="mv-w-[253px]">
        <ProjectCard
          project={{
            slug: "errormusic-len1g1op",
            name: "Error Music - don't delete!",
            responsibleOrganizations: [],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <ProjectCard
          project={{
            slug: "errormusic-len1g1op",
            name: "Error Music - don't delete!",
            excerpt:
              "Sound x Tech Format für Mädchen*, trans*, inter* und non-binäre Jugenliche ab 12 Jahren.",
            responsibleOrganizations: [],
          }}
        />
      </div>
      <div className="mv-w-[253px]">
        <ProjectCard
          project={{
            slug: "errormusic-len1g1op",
            name: "Error Music - don't delete!",
            background: "./error-music-background.jpeg",
            logo: "./error-music-logo.jpg",
            excerpt:
              "Sound x Tech Format für Mädchen*, trans*, inter* und non-binäre Jugenliche ab 12 Jahren.",
            responsibleOrganizations: [
              {
                organization: {
                  name: "MINTvernetzt",
                  slug: "mintvernetzt",
                  logo: "./mintvernetzt-logo.png",
                },
              },
              {
                organization: {
                  name: "matrix ggmbh",
                  slug: "matrixggmbh",
                  logo: "./matrixggmbh-logo.png",
                },
              },
              {
                organization: {
                  name: "MINT-Campus",
                  slug: "mintcampus-len1g1op",
                },
              },

              {
                organization: {
                  name: "matrix GmbH & Co. KG",
                  slug: "matrixgmbhcokg",
                },
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
ProjectStory.storyName = "project";

export default {
  title: "Organism/Cards",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
