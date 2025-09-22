import { useLocation } from "react-router";
import { Icon } from "./icons/Icon";
import { Children, isValidElement, useEffect, useRef, useState } from "react";

function Accordion(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);
  const topics = children.filter((child) => {
    return isValidElement(child) && child.type === AccordionTopic;
  });
  const items = children.filter((child) => {
    return isValidElement(child) && child.type === AccordionItem;
  });

  if (topics.length === 0 && items.length === 0) {
    throw new Error("Accordion must have at least one topic or item");
  }

  if (topics.length > 0) {
    return (
      <ul className="flex flex-col gap-10 @xl:gap-[52px] px-0 pt-0 pb-0 @md:px-8 @md:pt-8 @md:pb-12 @md:border @md:border-neutral-200 @md:rounded-2xl @md:bg-white">
        {topics}
      </ul>
    );
  }
  return <ul>{items}</ul>;
}

function AccordionTopic(props: React.PropsWithChildren & { id: string }) {
  const children = Children.toArray(props.children);
  const topicLabel = children.find((child) => {
    return typeof child === "string";
  });
  const items = children.filter((child) => {
    return isValidElement(child) && child.type === AccordionItem;
  });

  if (items.length === 0) {
    throw new Error("Accordion topic must have at least one item");
  }
  if (topicLabel === undefined) {
    throw new Error("Accordion topic must have a label");
  }

  return (
    <li key={`${props.id}-key`} className="relative">
      <div id={props.id} className="absolute -top-[76px] xl:-top-20" />
      <h2 className="mb-2 @md:mb-3 @xl:mb-5 text-secondary text-3xl font-semibold leading-7">
        {topicLabel}
      </h2>
      <ul>{items}</ul>
    </li>
  );
}

function AccordionItem(props: React.PropsWithChildren & { id: string }) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(
    location.hash === `#${props.id}`
  );
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollAnchorRef.current !== null && location.hash === `#${props.id}`) {
      setIsExpanded(true);
      scrollAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.hash, props.id]);

  const children = Children.toArray(props.children);
  const itemLabel = children.find((child) => {
    return typeof child === "string";
  });
  const content = children.filter((child) => {
    return isValidElement(child);
  });

  if (content.length === 0) {
    throw new Error("Accordion item must have html content");
  }
  if (itemLabel === undefined) {
    throw new Error("Accordion item must have a label");
  }

  return (
    <li
      key={`${props.id}-key`}
      className="group border-neutral-200 border-b relative"
    >
      <div
        ref={scrollAnchorRef}
        id={props.id}
        className="absolute -top-[76px] xl:-top-20"
      />
      <label
        htmlFor={`expand-question-${props.id}`}
        className="pb-6 pt-6 @xl:pb-8 @xl:pt-8 group-has-[:checked]:pb-0 text-primary-600 text-xl font-bold leading-6 cursor-pointer flex gap-2 items-center justify-between mb-0 focus-within:underline focus-within:underline-offset-4 focus-within:decoration-2"
      >
        <p className="max-w-[800px]">{itemLabel}</p>
        <span className="w-fit h-fit rotate-90 group-has-[:checked]:-rotate-90 mr-0 @md:mr-3 @lg:mr-6">
          <Icon type="chevron-right" aria-hidden="true" />
        </span>
        <input
          id={`expand-question-${props.id}`}
          type="checkbox"
          className="absolute opacity-0 w-0 h-0 overflow-hidden"
          checked={isExpanded}
          onChange={() => {
            setIsExpanded(!isExpanded);
          }}
        />
      </label>
      <div className="text-primary-600 leading-[20.8px] font-normal pt-[10px] pb-6 @xl:pt-4 @xl:pb-8 max-w-[800px] hidden group-has-[:checked]:block hyphens-auto">
        {content}
      </div>
    </li>
  );
}

Accordion.Topic = AccordionTopic;
Accordion.Item = AccordionItem;

export { Accordion };
