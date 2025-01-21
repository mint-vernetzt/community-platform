import React from "react";
import { Icon } from "./icons/Icon";

function Accordion(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);
  const topics = children.filter((child) => {
    return React.isValidElement(child) && child.type === AccordionTopic;
  });
  const items = children.filter((child) => {
    return React.isValidElement(child) && child.type === AccordionItem;
  });

  if (topics.length === 0 && items.length === 0) {
    throw new Error("Accordion must have at least one topic or item");
  }

  if (topics.length > 0) {
    return (
      <ul className="mv-flex mv-flex-col mv-gap-10 @xl:mv-gap-[52px] mv-px-0 mv-pt-0 mv-pb-0 @md:mv-px-8 @md:mv-pt-8 @md:mv-pb-12 @md:mv-border @md:mv-border-neutral-200 @md:mv-rounded-2xl @md:mv-bg-white">
        {topics}
      </ul>
    );
  }
  return <ul>{items}</ul>;
}

function AccordionTopic(props: React.PropsWithChildren & { id: string }) {
  const children = React.Children.toArray(props.children);
  const topicLabel = children.find((child) => {
    return typeof child === "string";
  });
  const items = children.filter((child) => {
    return React.isValidElement(child) && child.type === AccordionItem;
  });

  if (items.length === 0) {
    throw new Error("Accordion topic must have at least one item");
  }
  if (topicLabel === undefined) {
    throw new Error("Accordion topic must have a label");
  }

  return (
    <li key={props.id}>
      <h2 className="mv-mb-2 @md:mv-mb-3 @xl:mv-mb-5 mv-text-secondary mv-text-3xl mv-font-semibold mv-leading-7">
        {topicLabel}
      </h2>
      <ul>{items}</ul>
    </li>
  );
}

function AccordionItem(props: React.PropsWithChildren & { id: string }) {
  const children = React.Children.toArray(props.children);
  const itemLabel = children.find((child) => {
    return typeof child === "string";
  });
  const content = children.filter((child) => {
    return React.isValidElement(child);
  });

  if (content.length === 0) {
    throw new Error("Accordion item must have html content");
  }
  if (itemLabel === undefined) {
    throw new Error("Accordion item must have a label");
  }

  return (
    <li key={props.id} className="mv-group mv-border-neutral-200 mv-border-b">
      <label
        htmlFor={`expand-question-${props.id}`}
        className="mv-pb-6 mv-pt-6 @xl:mv-pb-8 @xl:mv-pt-8 group-has-[:checked]:mv-pb-0 mv-text-primary-600 mv-text-xl mv-font-bold mv-leading-6 mv-cursor-pointer mv-flex mv-gap-2 mv-items-center mv-justify-between mv-mb-0"
      >
        <p className="mv-max-w-[800px]">{itemLabel}</p>
        <span className="mv-w-fit mv-h-fit mv-rotate-90 group-has-[:checked]:-mv-rotate-90 mv-mr-0 @md:mv-mr-3 @lg:mv-mr-6">
          <Icon type="chevron-right" />
        </span>
      </label>
      <input
        id={`expand-question-${props.id}`}
        type="checkbox"
        className="mv-absolute mv-opacity-0 mv-w-0 mv-h-0 mv-overflow-hidden"
      />
      <div className="mv-text-primary-600 mv-leading-[20.8px] mv-font-normal mv-pt-[10px] mv-pb-6 @xl:mv-pt-4 @xl:mv-pb-8 mv-max-w-[800px] mv-hidden group-has-[:checked]:mv-block mv-hyphens-auto">
        {content}
      </div>
    </li>
  );
}

Accordion.Topic = AccordionTopic;
Accordion.Item = AccordionItem;

export { Accordion };
