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

export default {
  title: "Organism/Cards",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
