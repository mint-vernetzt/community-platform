import { cloneElement } from "react";

// TODO: Its not possible to provide nested components which is very unuseful if you want to insert lists f.e.
export function insertComponentsIntoLocale(
  locale: string,
  components:
    | Record<
        string,
        React.ReactElement<
          (Partial<unknown> & React.Attributes) | undefined,
          // TODO: fix type issue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          string | React.JSXElementConstructor<any>
        >
      >
    | Array<
        React.ReactElement<
          (Partial<unknown> & React.Attributes) | undefined,
          // TODO: fix type issue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          string | React.JSXElementConstructor<any>
        >
      >
) {
  if (Array.isArray(components)) {
    const regex = /<(\d+)>.*?<\/\1>/g;
    let match;
    let lastIndex = 0;
    const result = [];

    while ((match = regex.exec(locale)) !== null) {
      const index = parseInt(match[1], 10);
      result.push(locale.slice(lastIndex, match.index));
      const component = components[index];
      const children = match[0].replace(/<\d+>|<\/\d+>/g, "");
      result.push(
        cloneElement(
          component,
          { ...component.props, key: lastIndex },
          children
        )
      );
      lastIndex = regex.lastIndex;
    }

    result.push(locale.slice(lastIndex));
    return <>{result}</>;
  } else {
    const regex = /<(\w+)>.*?<\/\1>/g;
    let match;
    let lastIndex = 0;
    const result = [];

    while ((match = regex.exec(locale)) !== null) {
      const key = match[1];
      result.push(locale.slice(lastIndex, match.index));
      const component = components[key];
      const children = match[0].replace(
        new RegExp(`<${key}>|</${key}>`, "g"),
        ""
      );
      result.push(
        cloneElement(
          component,
          { ...component.props, key: lastIndex },
          children
        )
      );
      lastIndex = regex.lastIndex;
    }

    result.push(locale.slice(lastIndex));
    return <>{result}</>;
  }
}

export function insertParametersIntoLocale(
  locale: string,
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>
) {
  return locale.replace(/{{([^{}]+)}}/g, (match, key) => {
    const keys = key.split(".");
    let value = params;
    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        return match;
      }
    }
    return String(value);
  });
}

export function decideBetweenSingularOrPlural(
  singularLocale: string,
  pluralLocale: string,
  count: number
) {
  return count === 1 ? singularLocale : pluralLocale;
}
