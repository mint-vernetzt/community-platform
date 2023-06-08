import Button from "../../molecules/Button";
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
            areaNames: ["Hamburg", "Bundesweit"],
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
            areaNames: [],
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
            areaNames: [],
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
            areaNames: ["Hessen"],
            organizationTypes: ["Bildungseinrichtung"],
            focusses: ["Berufsorientierung", "Ländlicher Raum"],
            teamMembers: [
              {
                firstName: "Maria",
                lastName: "Lupan",
                slug: "marialupan",
                avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                slug: "jonaskakaroto",
                avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                slug: "toaheftiba",
                avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                slug: "behrouzsasani",
                avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
              },
              {
                firstName: "Maria",
                lastName: "Lupan",
                slug: "marialupan",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                slug: "jonaskakaroto",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                slug: "toaheftiba",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                slug: "behrouzsasani",
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
            areaNames: [],
            organizationTypes: ["Bildungseinrichtung"],
            focusses: [],
            teamMembers: [
              {
                firstName: "Maria",
                lastName: "Lupan",
                slug: "marialupan",
                avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                slug: "jonaskakaroto",
                avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                slug: "toaheftiba",
                avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                slug: "behrouzsasani",
                avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
              },
              {
                firstName: "Maria",
                lastName: "Lupan",
                slug: "marialupan",
              },
              {
                firstName: "Jonas",
                lastName: "Kakaroto",
                slug: "jonaskakaroto",
              },
              {
                firstName: "Toa",
                lastName: "Heftiba",
                slug: "toaheftiba",
              },
              {
                firstName: "Behrouz",
                lastName: "Sasani",
                slug: "behrouzsasani",
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
            areaNames: [],
            organizationTypes: ["Bildungseinrichtung"],
            focusses: [],
            teamMembers: [],
          }}
        />
      </div>
    </div>
  );
}
Organization.storyName = "organization";

export function Variants() {
  const profile1 = {
    username: "sirkokaiser",
    firstName: "Sirko",
    lastName: "Kaiser",
    memberOf: [],
    areaNames: [],
    offers: [],
  };
  const profile2 = {
    username: "colinkoenig",
    firstName: "Colin",
    lastName: "König",
    position: "UX Designer",
    avatar: "https://picsum.photos/id/1084/500/500",
    background: "https://picsum.photos/id/434/500/500",
    memberOf: [],
    areaNames: ["Bundesweit"],
    offers: ["Wirkungsorientierung/Qualitätsentwicklung"],
  };
  const profile3 = {
    academicTitle: "Prof. Dr.",
    username: "julialanglangschmittberger",
    firstName: "Julia",
    lastName: "Langlang-Schmittberger",
    position: "Software Engineer",
    avatar: "https://picsum.photos/id/435/500/500",
    background: "https://picsum.photos/id/436/500/500",
    memberOf: [],
    areaNames: ["Hamburg", "Bundesweit", "Niedersachsen", "Schleswig-Holstein"],
    offers: [
      "Wirkungsorientierung/Qualitätsentwicklung",
      "Beratung",
      "Coaching",
      "Moderation",
    ],
  };

  return (
    <>
      <div className="mv-py-12">
        <h1 className="mv-text-primary mv-font-black mv-text-5xl lg:mv-text-7xl mv-leading-tight mv-mb-2">
          Willkommen,
          <br />
          Anna Schröter
        </h1>
        <p className="mv-font-semibold mv-mb-4 lg:mv-mb-8">
          in Deiner MINTvernetzt-Community!
        </p>
        <p>
          <Button variant="outline">Mein Profil besuchen</Button>
        </p>
      </div>
      <div className="mv-relative">
        <div className="mv-flex mv-mb-4 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
            Profile
          </div>
          <div className="mv-text-right">
            <a
              href="/explore/profiles"
              className="mv-font-semibold mv-text-gray-400 mv-text-sm mv-leading-4 lg:mv-text-2xl lg:mv-leading-7"
            >
              Alle Profile
            </a>
          </div>
        </div>
        <div className="mv-flex mv--mx-2 md:mv--mx-4 mv-mb-8">
          <div className="mv-w-3/4 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile1} />
          </div>
          <div className="mv-w-3/4 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile2} match={80} />
          </div>
          <div className="mv-w-3/4 md:mv-mr-0 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile3} />
          </div>
        </div>
      </div>
      <div className="mv-flex mv-gap-8 mv-mb-8 mv-hidden">
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile2} match={80} />
        </div>
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
      <div className="mv-flex mv-gap-8 mv-hidden">
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile2} />
        </div>
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
    </>
  );
}
Variants.storyName = "Variants";

export default {
  title: "Organism/Cards",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
