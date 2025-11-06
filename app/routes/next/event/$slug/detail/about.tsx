import { ChipContainer } from "~/components/next/ChipContainer";
import ChipMedium from "~/components/next/ChipMedium";
import EventSubline from "~/components/next/EventSubline";
import EventTypeBadge from "~/components/next/EventTypeBadge";
import HeadlineAndTagsContainer from "~/components/next/HeadlineAndTagsContainer";
import HeadlineChipsAndTags from "~/components/next/HeadlineChipsAndTags";
import LabelAndChipsContainer from "~/components/next/LabelAndChipsContainer";
import LongTextContainer from "~/components/next/LongTextContainer";
import Tags from "~/components/next/Tags";

function About() {
  return (
    <div className="w-full flex flex-col gap-8 md:gap-10">
      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex flex-col gap-2">
          <EventTypeBadge>eventType 1 / eventType 2 / ...</EventTypeBadge>
          <EventSubline>subline</EventSubline>
        </div>
        <LongTextContainer>description</LongTextContainer>
      </div>
      <div className="w-full flex flex-col gap-6">
        <HeadlineAndTagsContainer>
          <HeadlineChipsAndTags as="h3">Veranstaltungsort</HeadlineChipsAndTags>
          <Tags as="address">
            venueName / venueStreet venueStreetNumber, venueZipCode venueCity
          </Tags>
        </HeadlineAndTagsContainer>
        <LabelAndChipsContainer>
          <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
            Das Event wird Zielgruppen aus folgenden Bildungsbereichen empfohlen
          </h3>
          <ChipContainer>
            <ChipMedium>eventTargetGroup 1</ChipMedium>
            <ChipMedium>eventTargetGroup 2</ChipMedium>
            <ChipMedium>eventTargetGroup 3</ChipMedium>
          </ChipContainer>
        </LabelAndChipsContainer>
        <LabelAndChipsContainer>
          <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
            MINT-Schwerpunkte
          </h3>
          <ChipContainer>
            <ChipMedium>focus 1</ChipMedium>
            <ChipMedium>focus 2</ChipMedium>
            <ChipMedium>focus 3</ChipMedium>
          </ChipContainer>
        </LabelAndChipsContainer>
        <LabelAndChipsContainer>
          <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
            Erfahrungsstufe
          </h3>
          <ChipContainer>
            <ChipMedium>experienceLevel</ChipMedium>
          </ChipContainer>
        </LabelAndChipsContainer>
        <LabelAndChipsContainer>
          <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
            Schlagworte
          </h3>
          <ChipContainer>
            <ChipMedium>tag 1</ChipMedium>
            <ChipMedium>tag 2</ChipMedium>
            <ChipMedium>tag 3</ChipMedium>
          </ChipContainer>
        </LabelAndChipsContainer>
      </div>
    </div>
  );
}

export default About;
