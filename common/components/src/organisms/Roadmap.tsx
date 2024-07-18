import React from "react";
import { useTranslation } from "react-i18next";

export type RoadmapColumnProps = {
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const countRoadmapCards = React.Children.count(props.children);
  const { t } = useTranslation(["organisms/roadmap"]);
  return (
    <div>
      <h4 className="mv-text-center mv-mb-4 mv-text-2xl mv-text-primary mv-font-bold">
        {props.title}
      </h4>
      <div className="mv-bg-blue-50 mv-rounded-lg mv-p-4 @xl:mv-p-6 mv-flex mv-flex-col mv-group">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="mv-peer mv-order-2 mv-h-0 mv-w-0 mv-opacity-0"
        />
        <div
          className={`mv-bg-blue-50 mv-rounded-lg mv-grid mv-overflow-hidden mv-transition-all mv-grid-rows-[repeat(2,_1fr)_repeat(99,_0fr)] @md:mv-grid-rows-[repeat(3,_1fr)_repeat(99,_0fr)] peer-checked:mv-grid-rows-${countRoadmapCards} mv-order-1`}
        >
          {props.children}
        </div>
        {countRoadmapCards > 3 ? (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="mv-order-3 mv-mt-4 @lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group"
          >
            <span className="show-more mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              {t("controls.showMore")}
            </span>
            <span className="show-less mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              {t("controls.showLess")}
            </span>
          </label>
        ) : countRoadmapCards > 2 ? (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="mv-order-3 mv-mt-4 @lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group @md:mv-hidden mv-underline mv-decoration-inherit mv-decoration-auto"
            >
              <span className="show-more mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                {t("controls.showMore")}
              </span>
              <span className="show-less mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                {t("controls.showLess")}
              </span>
            </label>
            <div className="mv-hidden @md:mv-block mv-mt-4 @lg:mv-mt-6 mv-h-5 mv-order-3"></div>
          </>
        ) : (
          <div className="mv-hidden @md:mv-block mv-mt-4 @lg:mv-mt-6 mv-h-5 mv-order-3"></div>
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
    <div className="mv-card mv-bg-white mv-rounded-lg mv-text-primary mv-w-full mv-px-4 @xl:mv-px-6">
      <h5 className="mv-font-bold mv-text-lg mv-mb-3">{props.title}</h5>
      <p>{props.text}</p>
    </div>
  );
}

function Roadmap() {
  const { t } = useTranslation(["organisms/roadmap"]);
  return (
    <section
      id="roadmap"
      className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)] mv-py-16 @lg:mv-py-24"
    >
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-y-8 @md:mv-gap-y-12 @md:mv-gap-x-4 @xl:mv-gap-x-4">
          <RoadmapColumn title={t("firstColumn.title")} id="1">
            <RoadmapCard
              title={t("firstColumn.firstCard.title")}
              text={t("firstColumn.firstCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.secondCard.title")}
              text={t("firstColumn.secondCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.thirdCard.title")}
              text={t("firstColumn.thirdCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.fourthCard.title")}
              text={t("firstColumn.fourthCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.fifthCard.title")}
              text={t("firstColumn.fifthCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.sixthCard.title")}
              text={t("firstColumn.sixthCard.description")}
            />
            <RoadmapCard
              title={t("firstColumn.seventhCard.title")}
              text={t("firstColumn.seventhCard.description")}
            />
          </RoadmapColumn>

          <RoadmapColumn title={t("secondColumn.title")} id="2">
            <RoadmapCard
              title={t("secondColumn.firstCard.title")}
              text={t("secondColumn.firstCard.description")}
            />
            <RoadmapCard
              title={t("secondColumn.secondCard.title")}
              text={t("secondColumn.secondCard.description")}
            />
            <RoadmapCard
              title={t("secondColumn.thirdCard.title")}
              text={t("secondColumn.thirdCard.description")}
            />
          </RoadmapColumn>

          <RoadmapColumn title={t("thirdColumn.title")} id="3">
            <RoadmapCard
              title={t("thirdColumn.firstCard.title")}
              text={t("thirdColumn.firstCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.secondCard.title")}
              text={t("thirdColumn.secondCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.thirdCard.title")}
              text={t("thirdColumn.thirdCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.fourthCard.title")}
              text={t("thirdColumn.fourthCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.fifthCard.title")}
              text={t("thirdColumn.fifthCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.sixthCard.title")}
              text={t("thirdColumn.sixthCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.seventhCard.title")}
              text={t("thirdColumn.seventhCard.description")}
            />
            <RoadmapCard
              title={t("thirdColumn.eighthCard.title")}
              text={t("thirdColumn.eighthCard.description")}
            />
          </RoadmapColumn>
        </div>
        <div className="mv-flex mv-justify-center mv-mt-12">
          <a
            className="mv-btn mv-border-2 mv-bg-white mv-border-primary mv-text-primary mv-text-base mv-font-semibold hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
            href="mailto:community@mint-vernetzt.de"
          >
            {t("controls.submitIdeas")}
          </a>
        </div>
      </div>
    </section>
  );
}

export default Roadmap;
