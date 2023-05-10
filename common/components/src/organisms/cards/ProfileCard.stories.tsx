import type { ProfileCardProps } from "./ProfileCard";
import ProfileCard from "./ProfileCard";

export function ProfileCardPlayground(args: ProfileCardProps) {
  return (
    <div className="w-[352px]">
      <ProfileCard {...args}>Button</ProfileCard>
    </div>
  );
}
ProfileCardPlayground.storyName = "Playground";

export default {
  title: "Organism/Cards/ProfileCards",
  component: ProfileCard,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
