import { ProfileCard } from "@mint-vernetzt/components";
import CardContainer from "./CardContainer";

const profile = {
  academicTitle: "Prof. Dr.",
  username: "julialanglangschmittberger",
  avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
  background: "./bla_giesserstrasse_12a-1512x1080.jpg",
  firstName: "Julia",
  lastName: "Langlang-Schmittberger",

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
};

export function CardContainerSingleRow() {
  const cards = [];
  for (let i = 0; i < 4; i++) {
    cards.push(<ProfileCard profile={profile} />);
  }

  return (
    <div>
      <CardContainer>{cards}</CardContainer>
    </div>
  );
}
CardContainerSingleRow.storyName = "single row";
CardContainerSingleRow.args = {};
CardContainerSingleRow.parameters = {
  viewport: {
    defaultViewport: "xl",
  },
};

export default {
  title: "Organism/Containers/cards",
  component: CardContainer,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
    layout: "fullscreen",
  },
};
