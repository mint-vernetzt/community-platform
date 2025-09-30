import { createElement, forwardRef } from "react";

export type HeadingTypes = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeadingStyles = "h0" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingProps extends React.HTMLProps<HTMLHeadingElement> {
  as: HeadingTypes;
  like?: HeadingStyles;
}

export const Heading = forwardRef(
  (props: HeadingProps, ref: React.ForwardedRef<HTMLHeadingElement>) => {
    const { as, ...otherProps } = props;
    let { like, className = "" } = props;

    if (like === undefined) {
      like = as;
    } else {
      className = `${className} ${like}`.trimStart();
    }

    const element = createElement(as, {
      className,
      ...otherProps,
      ref,
    });
    return element;
  }
);
Heading.displayName = "Heading";

export const H1 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h1" />;
  }
);
H1.displayName = "H1";

export const H2 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h2" />;
  }
);
H2.displayName = "H2";

export const H3 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h3" />;
  }
);
H3.displayName = "H3";

export const H4 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h4" />;
  }
);
H4.displayName = "H4";

export const H5 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h5" />;
  }
);
H5.displayName = "H5";

export const H6 = forwardRef(
  (
    props: { like?: HeadingStyles } & React.HTMLProps<HTMLHeadingElement>,
    ref: React.ForwardedRef<HTMLHeadingElement>
  ) => {
    return <Heading {...props} ref={ref} as="h6" />;
  }
);
H6.displayName = "H6";

export default Heading;
