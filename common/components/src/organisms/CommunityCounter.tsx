import React from "react";

export type CommunityCounterProps = {};

function CommunityCounter(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & CommunityCounterProps
) {
  const { ...otherProps } = props;

  return (
    <>
      {/* Do we create subcomponents here (f.e. <Counter></Counter>) or are we on a html level here? */}
    </>
  );
}

export default CommunityCounter;
