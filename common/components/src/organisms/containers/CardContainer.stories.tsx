import { languageModuleMap } from "~/locales-next.server/utils";
import { ProfileCard } from "./../cards/ProfileCard";
import { CardContainer } from "./CardContainer";

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
  areas: ["Hamburg", "Bundesweit"],
  offers: [
    "Wirkungsorientierung/Qualitätsentwicklung",
    "SEO",
    "Suchmaschinenoptimierung",
  ],
};

type CardContainerSingleRowProps = {
  numberOfCards: number;
};

export function CardContainerSingleRow(props: CardContainerSingleRowProps) {
  const cards = [];
  for (let i = 0; i < props.numberOfCards; i++) {
    cards.push(
      <ProfileCard
        profile={profile}
        locales={languageModuleMap.en["explore/profiles"]}
      />
    );
  }

  return (
    <div>
      <CardContainer>{cards}</CardContainer>
    </div>
  );
}
CardContainerSingleRow.storyName = "single row";
CardContainerSingleRow.args = {
  numberOfCards: 8,
};
CardContainerSingleRow.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
};

type CardContainerMultiRowProps = {
  numberOfCards: number;
};

export function CardContainerMultiRow(props: CardContainerMultiRowProps) {
  const cards = [];
  for (let i = 0; i < props.numberOfCards; i++) {
    cards.push(
      <ProfileCard
        profile={profile}
        locales={languageModuleMap.en["explore/profiles"]}
      />
    );
  }

  return (
    <div>
      <CardContainer type="multi row">{cards}</CardContainer>
    </div>
  );
}
CardContainerMultiRow.storyName = "multi row";
CardContainerMultiRow.args = {
  numberOfCards: 8,
};
CardContainerMultiRow.parameters = {
  controls: { disable: false },
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
