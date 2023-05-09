import React from "react";

export type ProfileCardProps = {};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { ...otherProps } = props;

  return <div></div>;
}

export default ProfileCard;
