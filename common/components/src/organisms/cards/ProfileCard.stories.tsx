import Chip from "../../../../../app/components/Chip/Chip";
import { Card, CardFooter, CardHeader, CardImage, CardStatus } from "./Card";
import type { ProfileCardProps } from "./ProfileCard";
import ProfileCard from "./ProfileCard";
import Avatar from "../../molecules/Avatar";

export function ProfileCardWithoutAreaInfo() {
  return (
    <div className="w-[352px]">
      <Card>
        <CardHeader></CardHeader>

        <div className="card-header px-4 pt-0 pb-6">
          <h4 className="text-primary text-base leading-5 font-bold mb-0">
            Ines Kurz
          </h4>
          <p className="text-neutral-700 text-sm leading-5 font-bold">
            Projektleiterin matrix gGmbH
          </p>
        </div>
        <div className="card-body p-4 pt-2 gap-0">
          <div className="text-xxs leading-4 mb-1">Aktivitätsgebiete</div>
          <div className="text-xs leading-4 mb-6 text-gray-400">
            -nicht angegeben-
          </div>

          <div className="text-xxs leading-4 mb-1">Ich biete</div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-secondary-50 text-secondary-600 text-xs py-1.5 px-3 rounded-lg font-semibold">
              <span className="text-ellipsis overflow-hidden text-left">
                Wirkungsorientierung/Qualitätsentwicklung
              </span>
            </div>
          </div>
        </div>
        <CardFooter>
          <Avatar
            name="Name"
            src="https://picsum.photos/id/433/500/500"
            size="sm"
          />
          <Avatar
            name="Name"
            src="https://picsum.photos/id/432/500/500"
            size="sm"
          />
        </CardFooter>
      </Card>
    </div>
  );
}
ProfileCardWithoutAreaInfo.storyName = "Keine Infos";

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
