import React from "react";

export type HeadingTypes = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeadingStyles = "h0" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingProps extends React.HTMLProps<HTMLHeadingElement> {
  as: HeadingTypes;
  like?: HeadingStyles;
}

export const Heading = React.forwardRef(
  (props: HeadingProps, ref: React.ForwardedRef<HTMLHeadingElement>) => {
    let { as, like, className = "", ...otherProps } = props;

    if (like === undefined) {
      like = as;
    } else {
      className = `${className} ${like}`.trimLeft();
    }

    const element = React.createElement(as, {
      className,
      ...otherProps,
      ref,
    });
    return element;
  }
);

export const H1 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h1" />;
  }
);

export const H2 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h2" />;
  }
);

export const H3 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h3" />;
  }
);

export const H4 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h4" />;
  }
);

export const H5 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h5" />;
  }
);

export const H6 = React.forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h6" />;
  }
);

export default Heading;
